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


const wrapper = document.getElementById("wrapper");

// Retrieve data from database
const startTime = performance.now();
var data = get(child(dbRef, `questions`)).then((snapshot) => {
    // hide loading screen after 2 seconds (or after data is loaded)
    const endTime = performance.now();
    setTimeout(function() {
        const loading = document.querySelector(".loading-body");
        loading.classList.add("fade-out")
        loading.style.pointerEvents = "none";
    }, 2000-(endTime-startTime));
    console.log("Time: " + (endTime-startTime) + "ms");
    
    if (!snapshot.exists()) {
        console.log("No data available");
    } 
    else
    {
        draw(snapshot.val());
        checkKeyPress(snapshot.val());
        checkAnswerChange(snapshot.val());
    }
}).catch((error) => {
    console.error(error);
});

function draw(data) {
    var first_index = Object.keys(data)[0];
    for (var i = first_index; i < first_index+data.length; i++) { // loop through questions
        // create question wrapper
        var question_wrapper = document.createElement("div");
        question_wrapper.className = "question_wrapper";
        question_wrapper.id = "question_" + i;
        wrapper.appendChild(question_wrapper);

        // create question
        var question = document.createElement("h2");
        question.innerHTML = data[i].question;
        question_wrapper.appendChild(question);

        // create answers
        for (var j = 0; j < data[i].answers.length; j++) { // loop through answers
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
                if (data[i].answers[j].type == "integer" || data[i].answers[j].type == "float")
                {
                    var default_val = (data[i].answers[j].default != null) ? data[i].answers[j].default : "";
                    var unit = data[i].answers[j].unit;
                    
                    answer.className = "text";
                    answer.innerHTML = '<input type="text" id="' + id + '" name="' + i + '" value="' + default_val + '"><label for="' + id + '"> ' + unit + '</label>';
                }
            }

            question_wrapper.appendChild(answer);
        }

        // check if question is based on condition --> hide
        if (data[i].condition != null)
            question_wrapper.style.display = "none";
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

function checkAnswerChange(data) {
    wrapper.addEventListener('change', function(e) {
        if (e.target.nodeName !== 'INPUT') {
            return;
        }
        
        //split id into question and answer
        var id = e.target.id.split("");

        
        if (e.target.type == 'radio' || e.target.type == 'checkbox')
        {
            for (var i = Object.keys(data)[0]; i < Object.keys(data)[0]+data.length; i++) // loop through questions
            {
                var i_condition = data[i].condition;
                var found = true;
                if (i_condition)
                {
                    i_condition.forEach(function(condition) {
                        if (document.getElementById(condition).checked !== true)
                            found = false;
                    });
                    if (found) // if question has condition with id of event target
                        document.getElementById("question_" + i).style.display = "block";
                    else
                        document.getElementById("question_" + i).style.display = "none";
                }
            }
        }
    });
}