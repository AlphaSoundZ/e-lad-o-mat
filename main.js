// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";
import { getDatabase, ref, set, child, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
apiKey: "AIzaSyCkMSxHBDSh6Hn-fPzY4E2r0UO8pv_hn-E",
authDomain: "database-42146.firebaseapp.com",
databaseURL: "https://database-42146-default-rtdb.europe-west1.firebasedatabase.app/",
projectId: "database-42146",
storageBucket: "database-42146.appspot.com",
messagingSenderId: "661698559004",
appId: "1:661698559004:web:733b92dd86003d9bb773d9",
measurementId: "G-9FQH6RHP5T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const dbRef = ref(getDatabase());

// ############################

// Read data from database
var data = get(child(dbRef, `questions`)).then((snapshot) => {
if (snapshot.exists()) {
    //draw(data);
    return snapshot.val();
} else {
    console.log("No data available");
}
}).catch((error) => {
    console.error(error);
});

// ############################

// Draw questions
data.then(function(data) {
    draw(data);
});


function draw(data) {
    for (var i = 0; i < data.length; i++) {
        var question = document.createElement("h2");
        question.innerHTML = data[i].question;
        console.log(data[i].question);
        document.getElementById("wrapper").appendChild(question);

        for (var j = 0; j < data[i].answers.length; j++) {
            var answer = document.createElement("div");
            var id = i.toString() + j.toString();
            answer.className = "checkmark";
            answer.innerHTML = '<input type="checkbox" id="' + id + '" name="' + id + '" value="' + id + '"><label for="' + id + '">' + data[i].answers[j] + '</label>';
            document.getElementById("wrapper").appendChild(answer);
        }
    }
}

const wrapper = document.getElementById('wrapper');


wrapper.addEventListener('click', function(e) {
    if (e.target.nodeName !== 'INPUT') {
        return;
    }

    console.log(e.target.value);
});