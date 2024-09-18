//Dev icon
function toggleInfoBox() {
    var infoBox = document.getElementById("infoBox");
    if (infoBox.style.display === "none" || infoBox.style.display === "") {
        infoBox.style.display = "block";
    } else {
        infoBox.style.display = "none";
    }
}

(function(){
    const socket = io();
    let sender_uid;

    // Function to extract URL parameters
    function getRoomIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('joinID');
    }

    // Auto-fill the Room ID if it's present in the URL
    window.onload = function() {
        const roomIdFromURL = getRoomIDFromURL();
        if (roomIdFromURL) {
            document.querySelector("#join-id").value = roomIdFromURL;
        }
    };

    // Join room by entering Room ID
    document.querySelector("#receiver-start-con-btn").addEventListener("click", function(){
        sender_uid = document.querySelector("#join-id").value;
        if (sender_uid.length === 0) return;

        let joinID = `receiver-${Math.random().toString(36).substr(2, 9)}`;
        socket.emit("receiver-join", { sender_uid: sender_uid, uid: joinID });

        document.querySelector(".join-screen").classList.remove("active");
        document.querySelector(".fs-screen").classList.add("active");
    });

    let fileShare = {};

    socket.on("fs-meta", function(metadata){
        fileShare.metadata = metadata;
        fileShare.transmitted = 0;
        fileShare.buffer = [];

        let el = document.createElement("div");
        el.classList.add("item");
        el.innerHTML = `
            <div class="progress">0%</div>
            <div class="filename">${metadata.filename}</div>
        `;
        document.querySelector(".files-list").appendChild(el);

        fileShare.progressNode = el.querySelector(".progress");

        socket.emit("fs-start", { uid: sender_uid });
    });

    socket.on("fs-share", function(buffer){
        fileShare.buffer.push(buffer);
        fileShare.transmitted += buffer.byteLength;
        fileShare.progressNode.innerText = Math.trunc((fileShare.transmitted / fileShare.metadata.total_buffer_size) * 100) + "%";

        if (fileShare.transmitted === fileShare.metadata.total_buffer_size) {
            download(new Blob(fileShare.buffer), fileShare.metadata.filename);
            fileShare = {};
        } else {
            socket.emit("fs-start", { uid: sender_uid });
        }
    });

    function download(blob, filename) {
        let a = document.createElement("a");
        a.href = window.URL.createObjectURL(blob);
        a.download = filename;
        a.click();
    }
})();
