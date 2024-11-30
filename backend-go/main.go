package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/rs/cors"
	"github.com/segmentio/kafka-go"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const (
	PORT      = ":3000"
	WS_PORT   = ":8081"
	DB_NAME   = "turbo"
	COLL_NAME = "tasks"
)

type Task struct {
	ID     primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Name   string             `json:"name" bson:"name"`
	Status string             `json:"status" bson:"status"`
	Remark string             `json:"remark" bson:"remark"`
}

type TasksResponse struct {
	Tasks       []Task `json:"tasks"`
	CurrentPage int    `json:"currentPage"`
	TotalPages  int    `json:"totalPages"`
	TotalTasks  int64  `json:"totalTasks"`
}

var (
	client     *mongo.Client
	collection *mongo.Collection
	upgrader   = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	wsClients = make(map[*websocket.Conn]bool)
)

func main() {
	// MongoDB 连接
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://admin:admin@127.0.0.1:27017/turbo?authSource=admin"
	}

	ctx := context.Background()
	var err error
	client, err = mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	collection = client.Database(DB_NAME).Collection(COLL_NAME)

	// HTTP 路由设置
	r := mux.NewRouter()
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Content-Type"},
	})

	r.HandleFunc("/tasks", getTasks).Methods("GET")
	r.HandleFunc("/tasks", createTask).Methods("POST")
	r.HandleFunc("/tasks/{id}", deleteTask).Methods("DELETE")
	r.HandleFunc("/tasks/{id}", updateTask).Methods("PUT")

	// WebSocket 服务器
	go startWebSocketServer()

	// Kafka 消费者
	go startKafkaConsumer()

	// 启动 HTTP 服务器
	handler := c.Handler(r)
	fmt.Printf("HTTP server running on port %s\n", PORT)
	log.Fatal(http.ListenAndServe(PORT, handler))
}

func getTasks(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	skip := (page - 1) * limit

	ctx := context.Background()
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit))
	cursor, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	var tasks []Task
	if err = cursor.All(ctx, &tasks); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalTasks, _ := collection.CountDocuments(ctx, bson.M{})
	totalPages := int(totalTasks)/limit + 1

	response := TasksResponse{
		Tasks:       tasks,
		CurrentPage: page,
		TotalPages:  totalPages,
		TotalTasks:  totalTasks,
	}

	json.NewEncoder(w).Encode(response)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	var task Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	result, err := collection.InsertOne(ctx, task)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	task.ID = result.InsertedID.(primitive.ObjectID)
	json.NewEncoder(w).Encode(task)
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	_, err = collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Task deleted"})
}

func updateTask(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id, err := primitive.ObjectIDFromHex(params["id"])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var task Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": task},
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	task.ID = id
	json.NewEncoder(w).Encode(task)
}

func startWebSocketServer() {
	http.HandleFunc("/ws", handleWebSocket)
	fmt.Printf("WebSocket server running on port %s\n", WS_PORT)
	log.Fatal(http.ListenAndServe(WS_PORT, nil))
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	wsClients[conn] = true
	defer delete(wsClients, conn)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			break
		}
		log.Printf("Received message: %s", message)
	}
}

func startKafkaConsumer() {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   []string{"kafka:9092"},
		Topic:     "turbo_turbo",
		Partition: 0,
		MinBytes:  10e3,
		MaxBytes:  10e6,
	})
	defer reader.Close()

	for {
		msg, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Printf("Kafka consumer error: %v", err)
			continue
		}

		// log.Printf("Received Kafka message: %s", string(msg.Value))

		// 广播消息给所有 WebSocket 客户端
		for client := range wsClients {
			err := client.WriteMessage(websocket.TextMessage, msg.Value)
			if err != nil {
				log.Printf("WebSocket write error: %v", err)
				client.Close()
				delete(wsClients, client)
			}
		}
	}
}
