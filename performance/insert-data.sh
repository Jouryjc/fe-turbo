#!/bin/bash

# 检查参数数量
if [ "$#" -ne 1 ]; then
    echo "使用方法: $0 <插入记录数>"
    exit 1
fi

# 从命令行参数获取插入记录数
record_count="$1"

# 创建一个mongodb的连接
mongo_uri="mongodb://127.0.0.1:27017"
database_name="turbo"

# 创建一个collection
collection_name="tasks"

# 写入指定数量的数据
mongo "$mongo_uri/$database_name" <<EOF
var collection = db.getCollection("$collection_name");
var bulk = collection.initializeUnorderedBulkOp();
var statusArray = ['pending', 'doing', 'finished'];
var recordCount = $record_count;
for (var i = 0; i < recordCount; i++) {
    bulk.insert({
        name: i,
        status: statusArray[Math.floor(Math.random() * statusArray.length)],
        remark: Math.random()
    });
    if (i % 1000 == 0) {
        bulk.execute();
        bulk = collection.initializeUnorderedBulkOp();
    }
}
if (i % 1000 != 0) {
    bulk.execute();
}
print("插入完成: " + collection.count() + " 条记录");
EOF

echo "数据插入完成"
