// Import the Firebase stuff
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getStorage,
    ref,
    listAll,
    getDownloadURL,
    uploadBytesResumable,
    deleteObject  // 👈 THIS IS NEEDED
  } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
  

// 🔥 Your Firebase config here
const firebaseConfig = {
    apiKey: "AIzaSyBcpcg2FU-PSJmzQvjaSMlCbwPaRcTq65A",
    authDomain: "deepdrive-6393c.firebaseapp.com",
    projectId: "deepdrive-6393c",
    storageBucket: "deepdrive-6393c.firebasestorage.app",
    messagingSenderId: "1008819986834",
    appId: "1:1008819986834:web:96bffdd0dd426f6464e14b"
  };
// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// 🔐 Monitor auth status
onAuthStateChanged(auth, user => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
  } else {
    console.log("❌ Logged out");
  }
});
function showToast(text, color = "green") {
  Toastify({
    text: text,
    duration: 3000,
    close: true,
    gravity: "bottom", 
    position: "right",
    style: {
      background: color
    }
  }).showToast();
}



// 📦 Sign Up
window.signUp = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      showToast("Signed up!", "green");    })
    .catch(error => {
      showToast("Error: " + error.message, "red");    });
};

// 🔓 Login
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      alert("Logged in!");
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
};

// 🔒 Logout
window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out!");
  });
};

// 📁 List Files in "uploads/" folder
window.listFiles = function () {
  const uploadsRef = ref(storage, "uploads/");

  listAll(uploadsRef)
    .then(res => {
      const list = document.getElementById("fileList");
      list.innerHTML = "";

      res.items.forEach(itemRef => {
        getDownloadURL(itemRef).then(url => {
          const div = document.createElement("div");
          div.className = "file-entry";
      
          const a = document.createElement("a");
          a.href = url;
          a.textContent = itemRef.name;
          a.target = "_blank";
      
          const renameBtn = document.createElement("button");
          renameBtn.textContent = "✏️";
          renameBtn.onclick = async () => {
            const newName = prompt("Enter new file name:");
            if (!newName) return;
          
            try {
              const url = await getDownloadURL(itemRef);
              const response = await fetch(url);
              const blob = await response.blob();
            
              const newRef = ref(storage, "uploads/" + newName);
              await uploadBytes(newRef, blob);
              await deleteObject(itemRef);
            
              alert("Renamed successfully!");
              listFiles(); // Refresh
            } catch (err) {
              alert("Rename failed: " + err.message);
            }
          };
          
      
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "🗑️";
          deleteBtn.onclick = () => {
            if (confirm(`Delete "${itemRef.name}"?`)) {
              deleteObject(itemRef)
                .then(() => {
                  alert("Deleted!");
                  listFiles();
                })
                .catch(err => alert("Delete failed: " + err.message));
            }
          };
      
          div.appendChild(a);
          div.appendChild(renameBtn);
          div.appendChild(deleteBtn);
          list.appendChild(div);
        });
      });
      
    })
    .catch(error => {
      alert("List error: " + error.message);
    });
};


// Make sure this is in your JS file
window.uploadFile = function () {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    showToast("Please select a file first!", "red");
    return;
  }

  const fileRef = ref(storage, "uploads/" + file.name);

  const uploadTask = uploadBytesResumable(fileRef, file);

  // Create and show progress bar
  // Create and show progress bar at the top
let progressBar = document.getElementById("uploadProgressBar");
if (!progressBar) {
  progressBar = document.createElement("progress");
  progressBar.id = "uploadProgressBar";
  progressBar.value = 0;
  progressBar.max = 100;
  progressBar.style.position = "fixed";
  progressBar.style.top = "0";
  progressBar.style.left = "0";
  progressBar.style.width = "100%";
  progressBar.style.height = "6px";
  progressBar.style.zIndex = "9999";
  progressBar.style.backgroundColor = "#f0f0f0";
  document.body.appendChild(progressBar);
}


  uploadTask.on('state_changed', 
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      progressBar.value = progress;
    }, 
    (error) => {
      console.error("Upload failed:", error);
      showToast("Error uploading file.", "red");
      progressBar.remove();
    }, 
    () => {
      showToast("File uploaded successfully!", "green");
      progressBar.remove();
      listFiles();
    }
  );
};

  