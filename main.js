// Connect to Firebase
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


// Retrieve data from database
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


// Draw questions
data.then(function(data) {
    draw(data);

    checkKeyPress(data);
});


function draw(data) {
    for (var i = 0; i < data.length; i++) {
        var question = document.createElement("h2");
        question.innerHTML = data[i].question;
        document.getElementById("wrapper").appendChild(question);

        for (var j = 0; j < data[i].answers.length; j++) {
            // types: checkbox, radio, text
            var answer = document.createElement("div");
            var id = i.toString() + j.toString();

            if (data[i].answer_type == "single")
            {
                answer.className = "radio";
                answer.innerHTML = '<input type="radio" id="' + id + '" name="' + i + '" value="' + id + '"><label for="' + id + '">' + data[i].answers[j] + '</label>';
            }
            else if (data[i].answer_type == "multi")
            {
                answer.className = "checkbox";
                answer.innerHTML = '<input type="checkbox" id="' + id + '" name="' + i + '" value="' + id + '"><label for="' + id + '">' + data[i].answers[j] + '</label>';
            }
            else if (data[i].answer_type == "text")
            {
                if (data[i].answers[j].type == "integer")
                {
                    var min = data[i].answers[j].min;
                    var max = data[i].answers[j].max;
    
                    answer.className = "text";
                    answer.innerHTML = '<input type="text" id="' + id + '" name="' + i + '" value="' + data[i].answers[j].default + '"><label for="' + id + '"> ' + data[i].answers[j].unit + '</label>';
                }
            }

            document.getElementById("wrapper").appendChild(answer);
        }
    }
}

function isValidNumber(el, event, type, min = null, max = null) {
    var charC = (event.which) ? event.which : event.keyCode;
    if ((charC == 46 || charC == 44) && type == "float")
    {
        if (el.value.indexOf('.') === -1 && el.value.indexOf(',') === -1)
        {
            return true;
        } 
        else
        {
            return false;
        }
    } 
    else
    {
        if (charC > 31 && (charC < 48 || charC > 57))
            return false;
    }

    // check min and max
    var true_value = el.value + String.fromCharCode(charC);
    if ((min != null && min > true_value) || (max != null && max < true_value))
        return false;
    
    return true;
}

function checkKeyPress(data) {
    wrapper.addEventListener('keypress', function(e) {
        if (e.target.nodeName !== 'INPUT') {
            return;
        }
    
        if (e.target.type == 'text')
        {
            //split id into question and answer
            var id = e.target.id.split("");
            var input_type = data[id[0]].answers[id[1]].type;
            var min = data[id[0]].answers[id[1]].min;
            var max = data[id[0]].answers[id[1]].max;
    
            if (!isValidNumber(e.target, e, input_type, min, max))
            {
                console.log("Invalid input");
                e.preventDefault();
                return false;
            }
        }
    });
}

const wrapper = document.getElementById('wrapper');