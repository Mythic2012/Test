async function fetchPosters(){
    const res = await fetch("http://localhost:3000/fetch-posters");
    posters = JSON.parse(await res.text());

    const postersDiv = document.getElementById("posters");
    postersDiv.innerHTML = "";

    for (const [key, value] of Object.entries(posters)) {
        let wrapper = document.createElement("div");
        wrapper.className = "wrapper"

        let title = document.createElement("h2")
        title.innerHTML = key
        title.className = "posterTitle"

        let img = document.createElement("img");
        img.src = value;
        img.className = "controlPoster"

        let deleteBtn = document.createElement("button");
        deleteBtn.className = "deleteBtn"
        deleteBtn.innerText = "Delete";
        deleteBtn.onclick = () => deletePoster(key);

        wrapper.appendChild(title)
        wrapper.appendChild(img);
        wrapper.appendChild(deleteBtn);
        postersDiv.appendChild(wrapper);
    };
}

async function deletePoster(name){
    await fetch("/delete-poster", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
    });

    fetchPosters(); 
}