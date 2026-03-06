const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const DATA_FILE = "todos.json";

function readTodos() {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
}

function saveTodos(todos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(todos, null, 2));
}

// GET todos
app.get("/api/todos", (req, res) => {
    res.json(readTodos());
});

// ADD todo
app.post("/api/todos", (req, res) => {
    const todos = readTodos();
    const newTodo = {
        id: Date.now(),
        text: req.body.text
    };

    todos.push(newTodo);
    saveTodos(todos);

    res.json(newTodo);
});

// DELETE todo
app.delete("/api/todos/:id", (req, res) => {
    let todos = readTodos();

    todos = todos.filter(t => t.id != req.params.id);

    saveTodos(todos);

    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});