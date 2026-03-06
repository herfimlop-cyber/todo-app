const API = "/api/todos";

async function loadTodos() {
    const res = await fetch(API);
    const todos = await res.json();

    const list = document.getElementById("list");
    list.innerHTML = "";

    todos.forEach(todo => {

        const li = document.createElement("li");

        li.innerHTML = `
        ${todo.text}
        <button onclick="deleteTodo(${todo.id})">Delete</button>
        `;

        list.appendChild(li);
    });
}

async function addTodo() {

    const input = document.getElementById("todoInput");

    await fetch(API,{
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify({
            text:input.value
        })
    });

    input.value="";
    loadTodos();
}

async function deleteTodo(id){

    await fetch(API+"/"+id,{
        method:"DELETE"
    });

    loadTodos();
}

loadTodos();