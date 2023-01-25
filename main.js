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
var data = get(dbRef).then((snapshot) => {
    // hide loading screen after 2 seconds (or after data is loaded)
    const endTime = performance.now();
    const data = snapshot.val();
    const questions = data["questions"];
    const recommendations = data["recommendations"];
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
        draw(questions);
        checkKeyPress(questions);

        var page_id = -1;
        var pre_result_page_id = questions.length;
        var result_page_id = null;

        // when user clicks on start button
        document.getElementById("start-button").addEventListener("click", function() {
            page_id = 0;
            firstQuestion(questions);

            toggleNextButton(page_id, questions);
        });

        // when user clicks on next button
        document.getElementById("next-button").addEventListener("click", function() {
            page_id = nextPage(page_id, questions);

            if (page_id < questions.length)
                toggleNextButton(page_id, questions);
        });

        // when user clicks on bock button
        document.getElementById("back-button").addEventListener("click", function() {
            page_id = previousPage(page_id, questions);

            if (page_id < questions.length)
                toggleNextButton(page_id, questions);
        });

        // when user clicks on submit button
        document.getElementById("submit-button").addEventListener("click", function() {
            createResultPages(recommendations, questions);
            page_id = firstResultPage(pre_result_page_id, questions);
        });

        // check if required condition is met for current question
        document.addEventListener("change", function() {
            toggleNextButton(page_id, questions);
        });
    }
}).catch((error) => {
    console.error(error);
});

// Page Generation Functions
function draw(data) {
    for (var i = 0; i < data.length; i++) { // loop through questions
        // create question wrapper
        var page_wrapper = document.createElement("div");
        page_wrapper.className = "page_wrapper question";
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
            else if (data[i].answer_type == "text") // integer, float, string
            {
                var default_val = (data[i].answers[j].default != null) ? data[i].answers[j].default : "";
                var unit = (data[i].answers[j].unit) ? data[i].answers[j].unit : "";
                
                answer.className = "text";
                answer.innerHTML = '<input type="text" id="' + id + '" name="' + i + '" value="' + default_val + '"><label for="' + id + '"> ' + unit + '</label>';
            }

            page_wrapper.appendChild(answer);
        }
    }


    // create pre-submit page
    var page_wrapper = document.createElement("div");
    page_wrapper.className = "page_wrapper pre-submit";
    page_wrapper.id = "page_" + data.length;
    wrapper.appendChild(page_wrapper);
    // create hint
    var p = document.createElement("p");
    p.innerHTML = "Aus den angegebenen Parametern sowie den gewünschten Funktionen der Ladeinfrastruktur ergeben sich folgende Empfehlungen für den Ausbau:";
    p.className = "hint pre-submit-text";
    page_wrapper.appendChild(p);
    hide(page_wrapper);
}

// Check Functions
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
    
        if (e.target.type == 'number')
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

function checkRequired(current_page_id, data) {
    var required = data[current_page_id].required;
    if (required)
    {
        for (var i = 0; i < data[current_page_id].answers.length; i++)
        {
            if (data[current_page_id].answer_type == "text" && document.getElementById(current_page_id.toString() + i).value == "") // every textbox must be filled
                return false;
            else if ((data[current_page_id].answer_type == "single" || data[current_page_id].answer_type == "multi") && document.getElementById(current_page_id.toString() + i).checked == true) // at least one checkbox must be checked
                return true;
        }

        if (data[current_page_id].answer_type == "text")
            return true;
        return false;
    }
    return true;
}

function checkCondition(data, page_id) {
    var condition = checkAnswerChange(data);

    // check if question is based on condition
    if (data[page_id].condition == null)
        return true;
    
    for (var i = 0; i < data[page_id].condition.length; i++)
    {
        if (document.getElementById(data[page_id].condition[i]).checked != true)
            return false;
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


// Result Functions

// import jsPDF
import 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.min.js';

function createResultPages(recommendations, questions) {
    // get answers
    var answers = getAnswers(questions);

    for (var i = 0; i < recommendations.length; i++)
    {
        createResultPage(answers, recommendations[i], i);
    }

    // generate and download the PDF
    var downloadBtn = document.getElementById("print-button");

    downloadBtn.addEventListener('click', function() {
        var pdf = new jsPDF();

        // create temp div to store the content
        var temp = document.createElement("div");
        temp.id = "temp";
        document.body.appendChild(temp);

        
        // add the content to the temp div
        for (var i = getFirstOfType("result"), last = getLastOfType("result"); i <= last; i++)
        {
            var recommendation_wrapper = document.getElementById("page_" + i);
            // create duplicate of recommendation wrapper
            var recommendation_wrapper_clone = recommendation_wrapper.cloneNode(true);
            temp.appendChild(recommendation_wrapper_clone);
        }

        // add the content to the PDF
        pdf.fromHTML(temp);

        // remove the temp div
        document.body.removeChild(temp);
        
        // Save the PDF
        pdf.save("Empfehlung.pdf");
    });
}

function createResultPage(answers, data, i) { // data = one recommendation, i = nth recommendation
    var id = getLastPageId() + 1;

    // create page wrapper
    var page_wrapper = document.createElement("div");
    page_wrapper.className = "page_wrapper result";
    page_wrapper.id = "page_" + id;
    wrapper.appendChild(page_wrapper);
    hide(page_wrapper);


    // create recommendation title
    var recommendation_title = document.createElement("h2");
    if (i == 0) // only the first recommendation has no number
        recommendation_title.innerHTML = data.title;
    else
        recommendation_title.innerHTML = "Empfehlung " + i + ": " + data.title;
    page_wrapper.appendChild(recommendation_title);

    // create paragraphs
    if (data.paragraphs == null)
        return;
    for (var i = 0; i < data.paragraphs.length; i++) // i = nth paragraph
    {
        // create paragraph
        var paragraph = document.createElement("p");

        var i_paragraph = data.paragraphs[i];
        for (var j = 0; j < i_paragraph["text"].length; j++) // j = nth text element in one paragraph
        {
            if (i_paragraph["text"][j].type == "var")
            {
                var x = i_paragraph["text"][j].id[0];
                var y = i_paragraph["text"][j].id[1];
                var text = answers[x][y];
            }
            else if (i_paragraph["text"][j].type == "string")
            {
                var text = i_paragraph["text"][j].string;
            }
            paragraph.innerHTML += text;
            page_wrapper.appendChild(paragraph);
        }


        // styling
        if (i_paragraph["type"] == "text")
        {
            paragraph.className = "text";
        }
        else if (i_paragraph["type"] == "hint")
        {
            paragraph.className = "hint";
        }
    }
}

// Page Navigation Functions
function backToHome(current_page_id) {
    // hide current Page
    hide(document.getElementById("page_" + current_page_id));

    // hide wrapper
    hide(wrapper);

    // hide back button
    hide(document.getElementById("back-button"));

    // hide next button
    hide(document.getElementById("next-button"));

    // hide submit button
    hide(document.getElementById("submit-button"));

    // show static content
    show(document.getElementById("start-content"));

    // show start button
    show(document.getElementById("start-button"));
}

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

function firstResultPage(current_page_id, data) {
    hide(document.getElementById("page_" + current_page_id));
    hide(document.getElementById("back-button"));
    hide(document.getElementById("submit-button"));
    show(document.getElementById("next-button"));
    show(document.getElementById("page_" + (getFirstOfType("result"))));

    return getFirstOfType("result");
}

function nextPage(current_page_id, data) {
    show(document.getElementById("back-button"));
    
    // hide current Page
    hide(document.getElementById("page_" + current_page_id));

    if (current_page_id+1 == getLastOfType("result"))
    {
        hide(document.getElementById("next-button"));
        show(document.getElementById("print-button"));
    }

    if (current_page_id == data.length-1 || (current_page_id == data.length-2 && checkCondition(data, current_page_id+1) == false)) // Pre-Submit Page
    {
        hide(document.getElementById("next-button"));
        show(document.getElementById("submit-button"));
    }
    else
    {
        // hide submit button
        hide(document.getElementById("submit-button"));
    }

    if (current_page_id+1 == getLastOfType("result"))
        show(document.getElementById("print-button"));
    
    if (current_page_id+1 < data.length && checkCondition(data, current_page_id+1) == false) // skip Page if condition is not met
    {
        // try the next Page
        return nextPage(current_page_id+1, data);
    }

    // show next Page
    show(document.getElementById("page_" + (current_page_id+1)));

    return current_page_id+1;
}

function previousPage(current_page_id , data) {
    show(document.getElementById("next-button"));
    // hide current Page
    hide(document.getElementById("page_" + current_page_id));
    
    if (current_page_id == 0) // home page
    {
        backToHome(current_page_id);
        return 0;
    }

    if (current_page_id == getLastOfType("result")) // last page was last result page
        hide(document.getElementById("print-button"));

    if (current_page_id-1 == getFirstOfType("result")) // result page
    {
        firstResultPage(current_page_id, data);
        return current_page_id-1;
    }

    if (current_page_id-1 < data.length && checkCondition(data, current_page_id-1) == false) // skip Page if condition is not met
    {
        // try the previous Page
        return previousPage(current_page_id-1, data);
    }

    // show previous Page
    show(document.getElementById("page_" + (current_page_id-1)));

    return current_page_id-1;
}


// Visibility Control Functions
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

function toggleNextButton(current_page_id, data) {
    var nextButton = document.getElementById("next-button");

    if (checkRequired(current_page_id, data))
        enable(nextButton);
    else
        disable(nextButton);
}



function getLastPageId() {
    var id = 0;
    while (document.getElementById("page_" + id) != null)
        id++;
    return id-1;
}

function getLastOfType(type) {
    var elements = document.getElementsByClassName(type);
    // check if empty
    if (elements.length != 0)
    {
        var id = elements[document.getElementsByClassName(type).length-1].id;
        return parseInt(id.substring(id.indexOf("_")+1));
    }
    return null;
}

function getFirstOfType(type) {

    var elements = document.getElementsByClassName(type);
    if (elements.length != 0)
    {
        var id = elements[0].id;
        return parseInt(id.substring(id.indexOf("_")+1));
    }
    return null;
}

function getAnswers(data) {
    var answers = [];
    for (var i = 0; i < data.length; i++)
    {
        answers[i] = []
        for (var j = 0; j < data[i].answers.length; j++)
        {
            var answer = document.getElementById(i.toString() + j);

            if (data[i].answer_type == "single" || data[i].answer_type == "multi")
                answers[i][j] = answer.checked;
            else
                answers[i][j] = answer.value;
        }
    }
    return answers;
}