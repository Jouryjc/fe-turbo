// init.js

// 切换到 'turbo' 数据库，如果不存在则创建
db = db.getSiblingDB('turbo');

// 创建 'turbo' 集合，如果不存在则创建
db.createCollection('turbo');