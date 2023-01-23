loadingAnimationFix();


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
    }, 700-(endTime-startTime));
    
    if (!snapshot.exists()) {
        console.log("No data available");
    } 
    else
    {
        draw(snapshot.val());
        checkKeyPress(snapshot.val());

        var question_id = -1;

        // when user clicks on start button
        document.getElementById("start-button").addEventListener("click", function() {
            question_id = 0;
            firstQuestion(snapshot.val());

            toggleNextButton(question_id, snapshot.val());
        });

        // when user clicks on next button
        document.getElementById("next-button").addEventListener("click", function() {
            question_id = nextQuestion(question_id, snapshot.val());

            if (question_id < snapshot.val().length)
                toggleNextButton(question_id, snapshot.val());
        });

        // when user clicks on bock button
        document.getElementById("back-button").addEventListener("click", function() {
            question_id = previousQuestion(question_id, snapshot.val());

            toggleNextButton(question_id, snapshot.val());
        });

        // when user clicks on submit button
        document.getElementById("submit-button").addEventListener("click", function() {
            createResultPage(snapshot.val());
        });

        // check if required condition is met for current question
        document.addEventListener("change", function() {
            toggleNextButton(question_id, snapshot.val());
        });
    }
}).catch((error) => {
    console.error(error);
});

function draw(data) {
    for (var i = 0; i < data.length; i++) { // loop through questions
        // create question wrapper
        var page_wrapper = document.createElement("div");
        page_wrapper.className = "page_wrapper";
        page_wrapper.id = "page_" + i;
        wrapper.appendChild(page_wrapper);

        // hide question
        hide(page_wrapper);


        // create question
        var question = document.createElement("h3");
        question.innerHTML = data[i].question;
        page_wrapper.appendChild(question);

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
                answer.innerHTML = '<input type="checkbox" id="' + id + '" name="' + i + '" value="' + id + '"><label for="' + id + '" required>' + data[i].answers[j] + '</label>';
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

            page_wrapper.appendChild(answer);
        }

        // check if question is based on condition --> hide
        if (data[i].condition != null)
            hide(page_wrapper);
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
    return wrapper.addEventListener('change', function(e) {
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
                    {
                        return i;
                    }
                    else
                        return -1;
                }
            }
        }
    });
}

function checkRequired(current_question_id, data) {
    var required = data[current_question_id].required;
    if (required)
    {
        for (var i = 0; i < data[current_question_id].answers.length; i++)
        {
            if (data[current_question_id].answer_type == "text" && document.getElementById(current_question_id.toString() + i).value == "") // every textbox must be filled
                return false;
            else if ((data[current_question_id].answer_type == "single" || data[current_question_id].answer_type == "multi") && document.getElementById(current_question_id.toString() + i).checked == true) // at least one checkbox must be checked
                return true;
        }

        if (data[current_question_id].answer_type == "text")
            return true;
        return false;
    }
    return true;
}

function checkCondition(data, question_id) {
    var condition = checkAnswerChange(data);

    // check if question is based on condition
    if (data[question_id].condition == null)
        return true;
    
    for (var i = 0; i < data.length; i++) // loop through questions
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
                return true;
            return false;
        }
    }
    
    
    
    if (condition != -1)
    {
        show(document.getElementById(condition));
    }
    else
    {
        hide(document.getElementById(condition));
    }
}

function loadingAnimationFix() {
    // Get the width of the scrollbar
    // Create a temporary div element
    var div = document.createElement("div");

    // Add styles to the div element
    div.style.overflow = "scroll";
    div.style.visibility = "hidden";
    div.style.width = "100px";
    div.style.height = "100px";

    // Append the div element to the body
    document.body.appendChild(div);

    // Get the width of the scrollbar
    var scrollbarWidth = div.offsetWidth - div.clientWidth;

    // Remove the div element from the body
    document.body.removeChild(div);

    // Set the width of the loading body
    var body = document.body,
    html = document.documentElement;
    var docHeight = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    document.getElementById("loading-body").style.width = (html.clientWidth - scrollbarWidth) + "px";
}


// import jsPDF
import 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.min.js';

function createResultPage(data) {
    // remove wrapper, static content, submit button, Fragenkatalog
    wrapper.remove();
    document.getElementById("submit").remove();
    document.getElementById("subtitle").remove();

    // create recommendation wrapper
    var recommendation_wrapper = document.createElement("div");
    var recommendation = document.createElement("div");
    recommendation_wrapper.appendChild(recommendation);
    document.body.appendChild(recommendation_wrapper);
    
    // Expample for creating a recommendation
    var recommendation_text = document.createElement("p");
    recommendation_text.innerHTML = "Empfehlung: ";
    recommendation.appendChild(recommendation_text);


    // create Download button
    var downloadBtn = document.createElement("button");
    downloadBtn.innerHTML = "Download PDF";
    document.body.appendChild(downloadBtn);

    // generate and download the PDF
    downloadBtn.addEventListener('click', function() {
        var pdf = new jsPDF();

        // add the rest of the content
        pdf.fromHTML(recommendation_wrapper, 15, 15);
        
        // Save the PDF
        pdf.save("Empfehlung.pdf");
    });
}


// start, next, back, submit button
function firstQuestion() {
    // hide static content
    hide(document.getElementById("start-content"));

    // hide start button
    hide(document.getElementById("start-button"));

    // show wrapper
    show(wrapper);

    // show back button
    show(document.getElementById("back-button"));

    // show submit button
    show(document.getElementById("next-button"));

    // show first question
    show(document.getElementById("page_0"));

}

function backToHome(current_question_id) {
    // hide current question
    hide(document.getElementById("page_" + current_question_id));

    // hide wrapper
    hide(wrapper);

    // hide back button
    hide(document.getElementById("back-button"));

    // hide next button
    hide(document.getElementById("next-button"));

    // hide submit button
    hide(document.getElementById("submit-button"));

    // hide submit button
    hide(document.getElementById("submit-button"));

    // hide first question
    hide(document.getElementById("page_0"));

    // show static content
    show(document.getElementById("start-content"));

    // show start button
    show(document.getElementById("start-button"));
}

function nextQuestion(current_question_id, data) {
    
    show(document.getElementById("back-button"));
    
    // hide current question
    hide(document.getElementById("page_" + current_question_id));


    if (current_question_id == data.length-1 || (checkCondition(data, current_question_id+1) == false && current_question_id+1 == data.length-1))
    {
        hide(document.getElementById("next-button"));
        show(document.getElementById("submit-button"));
        return current_question_id+1;
    }

    // hide submit button
    hide(document.getElementById("submit-button"));

    if (checkCondition(data, current_question_id+1) == false)
        return nextQuestion(current_question_id+1, data);

    if (current_question_id+1 == data.legth-1) // if next question is last question
    {
        hide(document.getElementById("next-button"));
        show(document.getElementById("submit-button"));
    }

    // show next question
    show(document.getElementById("page_" + (current_question_id+1)));

    return current_question_id+1;
}

function previousQuestion(current_question_id , data) {
    show(document.getElementById("next-button"));

    // hide current question
    hide(document.getElementById("page_" + current_question_id));
    
    if (current_question_id == 0)
    {
        backToHome(current_question_id);
        return 0;
    }

    // hide submit button
    hide(document.getElementById("submit-button"));

    if (checkCondition(data, current_question_id-1) == false)
        return previousQuestion(current_question_id-1, data);

    // show previous question
    show(document.getElementById("page_" + (current_question_id-1)));

    return current_question_id-1;
}

// show, hide
function show(element) {
    element.style.display = "block";
}

function hide(element) {
    element.style.display = "none";
}

function disable(element) {
    element.disabled = true;
}

function enable(element) {
    element.disabled = false;
}

// toggle
function toggleNextButton(current_question_id, data) {
    var nextButton = document.getElementById("next-button");

    if (checkRequired(current_question_id, data))
        enable(nextButton);
    else
        disable(nextButton);
}