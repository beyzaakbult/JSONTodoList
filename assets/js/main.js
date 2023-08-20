const usersUrl = "https://todorestapi-20432433159e.herokuapp.com/api/users/";
const todosUrl = "https://todorestapi-20432433159e.herokuapp.com/api/todos/";
const getOptıons = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
};
const newTodoForm = document.getElementById("new-todo");
        
const loadData = () => {
    fetch(usersUrl, getOptıons).then(usersResponse => {
        if (!usersResponse.ok) {
            throw new Error("HTTP status code: " + usersResponse.status + " for users");
        }
        return usersResponse.json();
    }).then(usersData=>{
        fetch(todosUrl, getOptıons).then(todosResponse => {
            if (!todosResponse.ok) {
                throw new Error("HTTP status code: " + todosResponse.status + " for todos");
            }
            return todosResponse.json();
        }).then(todosData=>{
            let users = [...usersData];
            let todos = [...todosData];
            todos.sort((a, b) => {
                return (a.created_at < b.created_at) ? 1 : ((a.created_at > b.created_at) ? -1 : 0);
            })
            users = users.map(user=>{
                const userTodos = todos.filter(todo=>todo?.assignee===user.id);
                return {...user,todo: userTodos.map(todo=>todo.id),todo_reference:{type:"todo", data:userTodos}}
            })
            const actorField = document.getElementById("todo-actor-field");
            const assigneeField = document.getElementById("todo-assignee-field");
            actorField.innerHTML = `<option value="" disabled selected hidden>Select a user</option>`;
            assigneeField.innerHTML = `<option value="" disabled selected hidden>Select a user</option>`;
            users.forEach(user=>{
                actorField.innerHTML+=`<option value=${user.id}>${user.username}</option>`;
                assigneeField.innerHTML+=`<option value=${user.id}>${user.username}</option>`;
            })
            todos = todos.map(todo=>{
                const todoAssıgnee = users.find(user=>user.id===todo?.assignee);
                const todoWriter = users.find(user=>user.id===todo?.actor);
                return {...todo, assignee_reference:{type:"user",data:todoAssıgnee},actor_reference:{type:"user",data:todoWriter}}
            })
            const data = {users:users,todos:todos};
    
            document.getElementById("list-todo").innerHTML = ""
            data.todos.forEach(todo=>{
                writeCard(todo, "todo", "list-todo", "", true);
            });
            data.todos.forEach(todo=>{
                Object.keys(todo).filter(key=>key.includes("_reference")).forEach(key=>{
                    writeCard(todo[key].data, todo[key].type, `additional-content-${todo.id}`,"hidden")
                })
            })
            data.todos.forEach(todo=>{
                const deleteButton = document.getElementById(`delete-${todo.id}`);
                deleteButton.addEventListener("click", ()=>handleDelete(todo))
            })
            data.todos.forEach(todo=>{
                const referenceKeys = Object.keys(todo).filter(key1=>Object.keys(todo).find(key2=>key2===key1+"_reference")).map(key=>key+"_reference");
                referenceKeys.forEach(key=>{
                    const button = document.getElementById(key+"-"+todo.id);
                    const toggleAdditionalContent = (key) => {
                        const containerId = `additional-content-${todo.id}`;
                        const cardId = todo[key].type+"-"+todo[key].data.id;
                        const card = document.querySelector(`#${containerId} .card#${cardId}`);
                        for (const element of document.querySelectorAll(".additional .card")) {
                            if (element.id!==cardId) element.classList.add("hidden")
                        }
                        card.classList.toggle("hidden")
                    }
                    button.addEventListener("click",()=>toggleAdditionalContent(key))
                })
                const todoEditButton = document.getElementById(`edit-${todo.id}`);
                todoEditButton.addEventListener("click", ()=>toggleEditForm(todo.id));
                const todoEditCancelButton = document.getElementById(`cancel-edit-${todo.id}`);
                todoEditCancelButton.addEventListener("click", ()=>toggleEditForm(todo.id));
            });
            newTodoForm.addEventListener("submit", handleNewTodoSubmit);
            for (const form of document.querySelectorAll(".todo-card-edit")) {
                form.addEventListener("submit", handleEditTodoSubmit)
            }
        })}
    )
}

window.addEventListener("storage", loadData);
window.dispatchEvent( new Event('storage') );

const handleDelete = (item) => {
    if (window.confirm("Do you really want delete this todo?")) {
        fetch(`https://todorestapi-20432433159e.herokuapp.com/api/todos/delete/${item.id}/`, {
            method: 'DELETE',
        }).then( (response) => { 
            if (!response.ok) {
                throw new Error("HTTP status code: " + response.status + " for deleting this todo");
            }
            else {
                window.dispatchEvent( new Event('storage') );
            }
        });
    }
}
const handleEditTodoSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target)
    const now = new Date();
    let payload = {
        updated_at: now.toISOString()
    }
    for (const [key,value] of formData.entries()) {
        if (["actor","assignee"].includes(key)) payload[key] = parseInt(value);
        else if (key==="completed") payload[key] = value==="on"?true:false;
        else payload[key] = value
    }
    const todoId = event.target.id.split("edit-todo-")[1];
    const card = event.target.closest(".card.editing");
    fetch(`https://todorestapi-20432433159e.herokuapp.com/api/todos/update/${todoId}`, {
        method: "PUT",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
        })
        .then( (response) => { 
            if (!response.ok) {
                throw new Error("HTTP status code: " + response.status + " for editing this todo");
            }
            else {
                card.classList.remove("editing")
                window.dispatchEvent( new Event('storage') );
                return response.json();
            }
        });
}
const handleNewTodoSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(newTodoForm)
    const now = new Date();
    let payload = {
        created_at: now.toISOString()
    }
    for (const [key,value] of formData.entries()) {
        if (["actor","assignee"].includes(key)) payload[key] = parseInt(value);
        else if (key==="completed") payload[key] = value==="on"?true:false;
        else payload[key] = value
    }
    fetch("https://todorestapi-20432433159e.herokuapp.com/api/todos/create/", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
        })
        .then( (response) => { 
            if (!response.ok) {
                throw new Error("HTTP status code: " + response.status + " for creating new todo");
            }
            else {
                newTodoForm.reset();
                window.dispatchEvent( new Event('storage') );
                return response.json();
            }
        });
}

const toggleEditForm = (itemId) => {
    for (const element of document.querySelectorAll(".card.editing")) {
        if (element.id!==`todo-${itemId}`) element.classList.remove("editing")
    }
    const card = document.getElementById(`todo-${itemId}`);
    card.classList.toggle("editing");
}

const writeCard = (item, dataType, targetElementId, cardClass="", hasAdditionalContent) => {
    const cardConfiguration = configurations?.[dataType]?.card;

    const headerKeys = cardConfiguration?.header?.keys || [];
    const bodyKeys = cardConfiguration?.body?.keys || [];
    const footerKeys = cardConfiguration?.footer?.keys || [];

    const headerLabels = cardConfiguration?.header?.showLabels;
    const bodyLabels = cardConfiguration?.body?.showLabels;
    const footerLabels = cardConfiguration?.footer?.showLabels;

    const targetElement = document.getElementById(targetElementId);

    const getLine = (key, showLabel, lineClass, clickable) => {
        const label = getLabel(key, dataType);
        const value = clickable?
            `<button id="${key}_reference-${item.id}" class="reference-button text-button">${getValue(key, item, dataType)}</button>`
            : getValue(key, item, dataType)
        if (showLabel) return `<tr class="${lineClass}"><td>${label}</td><td>:</td><td>${value}</td></tr>`
        else return `<tr class="${lineClass}"><td colspan="3">${value}</td></tr>`
    };
    
    const isClickable = (key) => hasAdditionalContent && ["reference","reference_list"].includes(configurations?.[dataType].keys?.[key]?.type)
    
    targetElement.innerHTML += `
        <table><tbody><tr>
            <td class="card-column">
                <div id="${dataType}-${item.id}" class="card ${cardClass?cardClass:""}">
                    ${dataType==="todo"?`
                        <div class="card-actions">
                            <button id="edit-${item.id}" class="edit-button">Edit</button>
                            <button id="cancel-edit-${item.id}" class="cancel-edit-button">Cancel</button>
                            <button id="delete-${item.id}" class="delete-button">Delete</button>
                        </div>
                        <div id="edit-form-container-${item.id}" class="card-edit-form"></div>`
                        :""
                    }
                    <div id="card-info-${item.id}" class="card-info">
                        <table class="card-title"><tbody>${headerKeys?.map(key=>getLine(key, headerLabels, "card-header", isClickable(key))).join("")}</tbody></table>
                        <table class="card-content"><tbody>
                            ${bodyKeys?.map(key=>getLine(key, bodyLabels, "card-body", isClickable(key))).join("")}
                            ${footerKeys?.map(key=>getLine(key, footerLabels, "card-footer", isClickable(key))).join("")}
                        </tbody></table>
                    </div>
                </div>
            </td>
            <td id="additional-content-${item.id}" class="card-column additional"></td>
        </tr></tbody></table>
    `;
    if (dataType==="todo") {
        document.getElementById(`edit-form-container-${item.id}`).innerHTML +=`
            <div class="edit-todo-header"><h3>Edit assignment #${item.id}</h3></div>
            <form id="edit-todo-${item.id}" class="todo-card-edit">
                <table>
                    <tbody>
                        <tr>
                            <td>Title</td>
                            <td>:</td>
                            <td>
                                <input class="text-input" id="title-field-${item.id}" name="title" type="text" value="${item.title}"></input>
                            </td>
                        </tr>
                        <tr>
                            <td>Actor</td>
                            <td>:</td>
                            <td>
                                <select class="select-input" id="actor-field-${item.id}" name="actor" id="cars" form="edit-todo-${item.id}">
                                    <option value=${item.actor} disabled selected hidden>${getValue("actor",item,"todo")}</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Assignee</td>
                            <td>:</td>
                            <td>
                                <select class="select-input" id="assignee-field-${item.id}" name="assignee" id="cars" form="edit-todo-${item.id}">
                                    <option value=${item.assignee} disabled selected hidden>${getValue("assignee",item,"todo")}</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td>Completed</td>
                            <td>:</td>
                            <td>
                                <input class="check-input" id="completed-field-${item.id}" name="completed" type="checkbox" ${item.completed?"checked":""}></input>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <br/>
                <div class="form-submit-button"><button type="submit">Submit</button></div>
            </form>`;
        const editActorField = document.getElementById(`actor-field-${item.id}`);
        const editAssigneeField = document.getElementById(`assignee-field-${item.id}`);
        for (const option of document.getElementById("todo-actor-field").children) {
            if (!option.disabled) {
                const optionCopy1 = option.cloneNode(true);
                const optionCopy2 = option.cloneNode(true);
                editActorField.appendChild(optionCopy1);
                editAssigneeField.appendChild(optionCopy2)
            }
        }
    }
}
function capitalize(string) {
    if (string) { 
        return string.charAt(0).toUpperCase() + string.slice(1)
    }
    else return ""
    
}

const getLabel = (key, dataType) => {
    const label = configurations?.[dataType]?.keys?.[key]?.label
    if (label) return label;
    else return key
}

const getValue = (key, dataItem, dataType) => {
    const keyConfiguration = configurations?.[dataType]?.keys?.[key];
    const valueType = keyConfiguration?.type;
    const value = dataItem[key];
    if (keyConfiguration?.valueLabels?.[value]) return keyConfiguration?.valueLabels?.[value]
    let result = value;
    if (value!==null && value!==undefined) {
        if (valueType==="id") result = `${capitalize(dataType)} #${value}`
        if (valueType==="integer") result = parseInt(value);
        if (valueType==="string") result = `${value}`.trim();
        if (valueType==="datetime") {
            const dateTimeValue = new Date(value);
            const locale = navigator.language;
            result = dateTimeValue.toLocaleString(locale, { timeZone: 'UTC' })
        }
        if (["reference","reference_list"].includes(valueType)) {
            const referenceKey = [key,"reference"].join("_");
            const referenceObject = dataItem?.[referenceKey];
            const referenceType = referenceObject?.type;
            const referenceData = referenceObject?.data
            const referedKey = configurations?.[referenceType]?.referedKey;
            if (referedKey) {
                if (valueType==="reference") {
                    result = getValue(referedKey, referenceData, referenceType)
                }
                if (valueType==="reference_list") {
                    result = referenceData?.map(rdata=>getValue(referedKey,rdata,referenceType))
                }
            }
        }
    }
    return result
}

const configurations = {
    user: {
        referedKey: "username",
        keys: {
            id: { type:"id",  label:"ld" },
            username: { type: "string", label: "User", refer:true },
            first_name: { type: "string", label: "First name" },
            last_name: { type: "string", label: "Last name" },
            email: { type: "string", label: "Email" },
            phone: { type: "string", label: "Phone"},
            date_joined: { type: "datetime", label: "User since" },
            todo: { type: "reference_list", label: "Tasks", reference_type:"todo" }
        },
        card: {
            header: { showLabels:false, keys: ["username"] },
            body: { showLabels:true, keys: ["first_name", "last_name", "email", "phone"] },
            footer: { showLabels: true, keys: ["date_joined"] }
        }
    },
    todo: {
        referedKey: "title",
        keys: {
            id: { type:"id",  label:"ld" },
            title: { type: "string", label: "Assignment" },
            completed: { type: "boolean", label: "Status", valueLabels:{ true:"Done", false:"Not done" } },
            created_at: { type: "datetime", label: "Added at" },
            updated_at: { type: "datetime", label: "Last update" },
            actor: { type: "reference", label: "Added by", reference_type:"user" },
            assignee: { type: "reference", label: "Assigned to", reference_type:"user" }
        },
        card: {
            header: { showLabels: false, keys: ["id"] },
            body: { showLabels: true, keys: ["assignee", "title", "completed"] },
            footer: { showLabels :true, keys :["updated_at", "created_at", "actor"] }
        }
    }
}