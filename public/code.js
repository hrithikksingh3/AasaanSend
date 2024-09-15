(function(){
    let receiverID;
    const socket = io();

    function generateID(){
        return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
    }

    document.querySelector("#sender-start-con-btn").addEventListener("click",function(){
        let joinID = generateID();
        document.querySelector("#join-id").innerHTML = `
            <b>Room ID</b>
            <span>${joinID}</span>
        `;
        socket.emit("sender-join", {
            uid:joinID
        });
    });

    document.querySelector("#copy-btn").addEventListener("click", function() {
        const roomId = document.querySelector("#join-id span").textContent;
        navigator.clipboard.writeText(roomId).then(function() {
            alert("Room ID copied to clipboard!");
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
    });

    document.querySelector("#share-btn").addEventListener("click", function() {
        const roomId = document.querySelector("#join-id span").textContent;
        if (navigator.share) {
            navigator.share({
                title: 'Join my file sharing room',
                text: `Join my file sharing room with ID: ${roomId}`,
                url: window.location.href
            }).then(() => console.log('Successful share'))
            .catch((error) => console.log('Error sharing', error));
        } else {
            alert("Web Share API is not supported in your browser. Please copy the room ID manually.");
        }
    });

    socket.on("init",function(uid){
        receiverID = uid;
        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
    });

    document.querySelector("#file-input").addEventListener("change",function(e){
        let file = e.target.files[0];
        if(!file){
            return;     
        }
        let reader = new FileReader();
        reader.onload = function(e){
            let buffer = new Uint8Array(reader.result);

            let el = document.createElement("div");
            el.classList.add("item");
            el.innerHTML = `
                    <div class="progress">0%</div>
                    <div class="filename">${file.name}</div>
            `;
            document.querySelector(".files-list").appendChild(el);
            shareFile({
                filename: file.name,
                total_buffer_size:buffer.length,
                buffer_size:1024,
            }, buffer, el.querySelector(".progress"));
        }
        reader.readAsArrayBuffer(file);
    });

    function shareFile(metadata,buffer,progress_node){
        socket.emit("file-meta", {
            uid:receiverID,
            metadata:metadata
        });
        
        socket.on("fs-share",function(){
            let chunk = buffer.slice(0,metadata.buffer_size);
            buffer = buffer.slice(metadata.buffer_size,buffer.length);
            progress_node.innerText = Math.trunc(((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100)) + "%";
            if(chunk.length != 0){
                socket.emit("file-raw", {
                    uid:receiverID,
                    buffer:chunk
                });
            } else {
                console.log("Sent file successfully");
            }
        });
    }
})();

//Dev icon
function toggleInfoBox() {
    var infoBox = document.getElementById("infoBox");
    if (infoBox.style.display === "none" || infoBox.style.display === "") {
        infoBox.style.display = "block";
    } else {
        infoBox.style.display = "none";
    }
}