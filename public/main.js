loadingAnimationFix();


// Connect to Firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";
import { getDatabase, ref, set, child, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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
        loading.classList.add("fade-out");
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
        document.addEventListener("input", function() {
            toggleNextButton(page_id, questions);
        });
    }
}).catch((error) => {
    console.error(error);
});

// Page Generation Functions
function draw(data) {
    var index = 0;
    for (var i = 0; i < data.length; i++) { // loop through questions
        // create question wrapper
        var page_wrapper = document.createElement("div");
        page_wrapper.className = "page_wrapper question";
        page_wrapper.id = "page_" + i;
        wrapper.appendChild(page_wrapper);

        // hide question
        hide(page_wrapper);

        // create title
        var question = document.createElement("h3");
        question.innerHTML = data[i].question;
        page_wrapper.appendChild(question);

        // create hint
        if (data[i].hint != null)
        {
            var hint = document.createElement("p");
            hint.innerHTML = data[i].hint;
            hint.className = "hint";
            page_wrapper.appendChild(hint);
        }

        // create answers
        for (var j = 0; j < data[i].answers.length; j++) { // loop through answers
            // types: checkbox, radio, text
            var answer = document.createElement("div");
            var id = index;
            answer.id = id;
            index++;

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
                var label = (data[i].answers[j].label) ? data[i].answers[j].label : "";
                if (label != "")
                {
                    var label_el = document.createElement("label");
                    label_el.setAttribute("for", id);
                    label_el.innerHTML = label;
                    answer.appendChild(label_el);
                }
                
                var default_val = (data[i].answers[j].default != null) ? data[i].answers[j].default : "";
                var placeholder = (data[i].answers[j].placeholder) ? data[i].answers[j].placeholder : "";
                
                answer.className = "text";
                answer.innerHTML += '<input type="text" id="' + id + '" name="' + i + '" placeholder="' + placeholder + '" value="' + default_val + '">';
            }

            page_wrapper.appendChild(answer);
        }
    }


    // create pre-submit page
    var page_wrapper = document.createElement("div");
    page_wrapper.className = "page_wrapper pre-submit";
    page_wrapper.id = "page_" + data.length;
    wrapper.appendChild(page_wrapper);

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
    
        if (e.target.type == "text")
        {
            //split id into question and answer
            var id = getDataId(e.target.id, data);
            var input_type = data[id[0]].answers[id[1]].type;
            var min = data[id[0]].answers[id[1]].min;
            var max = data[id[0]].answers[id[1]].max;

            if (input_type == "string")
            {
                return;
            }
            if (!isValidNumber(e.target, e, input_type, min, max))
            {
                e.preventDefault();
                return false;
            }
        }
    });
}

function checkRequired(current_page_id, data) { // return true if requirements are met
    var required = data[current_page_id].required;
    if (required)
    {
        for (var i = 0; i < data[current_page_id].answers.length; i++)
        {
            if (data[current_page_id].answer_type == "text" && document.getElementById(getFirstQuestionIndexOfPage(current_page_id, data) + i).querySelector("input").value == "") // every textbox must be filled
                return false;
            else if ((data[current_page_id].answer_type == "single" || data[current_page_id].answer_type == "multi") && document.getElementById(getFirstQuestionIndexOfPage(current_page_id, data) + i).querySelector("input").checked == true) // at least one checkbox must be checked
                return true;
        }

        if (data[current_page_id].answer_type == "text")
            return true;
        return false;
    }
    return true;
}

function checkCriterias(questions, page_id) { // return true if condition is met and the question should be shown
    // check if question is based on condition
    if (questions[page_id].criterias == null)
        return true;

    var criterias = questions[page_id].criterias;
    for (var j = 0; j < criterias.length; j++) // or condition
    {
        var result = false;
        for (var k = 0; k < criterias[j].length; k++) // and condition
        {
            // check condition
            var condition_id = criterias[j][k].id;
            var operator = criterias[j][k].operator;
            var question_id = getFirstQuestionIndexOfPage(condition_id[0], questions) + parseInt(condition_id[1]);

            if (questions[condition_id[0]].answers[condition_id[1]].answer_type == "text")
            { // convert value to bool
                var answer = (document.getElementById(question_id).querySelector("input").value == "") ? false : true;
            }
            else
            {
                var answer = document.getElementById(question_id).querySelector("input").checked;
            }

            if ((operator == "==" && answer == true) || (operator == "!=" && answer == false))
            {
                result = true;
            }
            else
            {
                result = false;
                break;
            }
        }

        if (result == true)
            break;
    }

    if (result == false)
    {
        // reset values of page
        var page = document.getElementById("page_" + page_id);
        var inputs = page.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++)
        {
            inputs[i].value = "";
            inputs[i].checked = false;
        }
    }
    return result;
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


function checkResultCriterias(criterias, questions, answers) {
    // check criterias
    for (var i = 0; i < criterias.length; i++) // or condition
    {
        var result = false;
        for (var j = 0; j < criterias[i].length; j++) // and condition
        {
            // check condition
            var condition_id = (criterias[i][j].id != null) ? criterias[i][j].id : null;
            var condition_question_id = (criterias[i][j].question != null) ? criterias[i][j].question : null;
            
            var operator = criterias[i][j].operator;

            if (condition_question_id != null)
            {
                var answer = null;
                for (var k = 0; k < answers[condition_question_id].length; k++)
                {
                    if (questions[condition_question_id].answer_type == "text")
                    { // convert value to bool
                        answer = (answers[condition_question_id][k] == "") ? false : true;
                    }
                    else
                    {
                        answer = answers[condition_question_id][k];
                    }
                }
                    if (answers[condition_question_id][k] == true)
                        result = true;
            }
            else if (condition_id != null)
            {
                if (questions[condition_id[0]].answer_type == "text")
                { // convert value to bool
                    answer = (answers[condition_id[0]][condition_id[1]] == "") ? false : true;
                }
                else
                {
                    answer = answers[condition_id[0]][condition_id[1]];
                }
            }

            // check condition operator and answer
            if ((operator == "==" && answer == true) || (operator == "!=" && answer == false))
            {
                result = true;
            }
            else
            {
                result = false;
                break;
            }

        }

        if (result == true)
            break;
    }

    if (result == false)
        return false;
    return true;
}


// Result Functions
function createResultPages(recommendations, questions) {
    // get answers
    var answers = getAnswers(questions);
    var skipped = 0;

    for (var i = 0; i < recommendations.length; i++)
    {
        var created = createResultPage(answers, recommendations[i], questions, i, skipped);
        if (created == false)
            skipped++;
    }

    // generate and download the PDF
    var downloadBtn = document.getElementById("print-button");

    downloadBtn.addEventListener('click', function() {
        console.log("download");
        //var pdf = new jsPDF();

        // create temp div to store the content
        var temp = document.createElement("div");
        temp.id = "temp";
        
        // hide last page
        var last_page = document.getElementById("page_" + getLastPageId());
        last_page.style.display = "none";
        
        // hide print button
        var print_button = document.getElementById("print-button");
        print_button.style.display = "none";
        
        // show Title
        var title = document.getElementById("title");
        title.style.display = "block";
        
        document.body.appendChild(temp);
        
        // add the content to the temp div
        for (var i = getFirstOfType("result"), last = getLastOfType("result"); i <= last; i++)
        {
            var recommendation_wrapper = document.getElementById("page_" + i);
            // create duplicate of recommendation wrapper
            var recommendation_wrapper_clone = recommendation_wrapper.cloneNode(true);
            temp.appendChild(recommendation_wrapper_clone);
            
            // set visibility to visible
            recommendation_wrapper_clone.style.display = "block";
        }

        // create last page
        var last_page = document.createElement("div");
        last_page.id = "page_" + (getLastPageId() + 1);
        last_page.className = "page_wrapper result";

        // title
        var title = document.createElement("h3");
        title.innerHTML = "Bauprinzip und Ausstattungsmerkmale";
        last_page.appendChild(title);

        // text
        var text = document.createElement("p");
        text.innerHTML = "Schemadarstellung Ladesäule und Anordnung am Stellplatz";
        last_page.appendChild(text);

        // svg image
        var svg = document.createElement("img");
        svg.src = "ressources/schemazeichnung.svg";
        svg.style.width = "75%";
        svg.style.height = "75%";
        svg.style.marginTop = "20px";
        last_page.appendChild(svg);

        temp.appendChild(last_page);
        

        //hide elements with class break
        var break_elements = document.getElementsByClassName("break");
        for (var i = 0; i < break_elements.length; i++)
        {
            break_elements[i].style.display = "none";
        }

        // hide navigation
        var navigation = document.getElementById("navigation-body");
        navigation.style.display = "none";

        wrapper.appendChild(temp);
    });
}
function createResultPage(answers, recommendation, questions, i, skipped) { // recommendation = one recommendation, i = nth recommendation
    var id = getLastPageId() + 1;

    // check for general criterias for recommendation
    var criterias = (recommendation.criterias == null) ? [] : recommendation.criterias;

    if (criterias.length != 0 && checkResultCriterias(criterias, questions, answers) == false)
        return false;

    // create page wrapper
    var page_wrapper = document.createElement("div");
    page_wrapper.className = "page_wrapper result";
    page_wrapper.id = "page_" + id;
    wrapper.appendChild(page_wrapper);
    hide(page_wrapper);


    // create recommendation title
    var recommendation_title = document.createElement("h2");
    if (i == 0) // only the first recommendation has no number
        recommendation_title.innerHTML = recommendation.title;
    else
        recommendation_title.innerHTML = "Empfehlung " + (i-skipped) + ": " + recommendation.title;
    page_wrapper.appendChild(recommendation_title);

    // create paragraphs
    if (recommendation.paragraphs == null)
        return false;
    
    for (var i = 0; i < recommendation.paragraphs.length; i++) // i = nth paragraph
    {
        var paragraph_criterias = (recommendation.paragraphs[i].criterias == null) ? [] : recommendation.paragraphs[i].criterias;
        if (paragraph_criterias.length != 0 && checkResultCriterias(paragraph_criterias, questions, answers) == false)
            continue;
        
        if (recommendation.paragraphs[i].type == "table") // create table
        {
            // create table
            var table = document.createElement("table");
            var i_table = recommendation.paragraphs[i];

            // styling
            table.style.width = "40%";

            for (var j = 0; j < i_table["table"].length; j++)
            {
                var tr = document.createElement("tr");
                var i_row = i_table["table"][j];

                for (var k = 0; k < i_row.length; k++)
                {
                    var text = getText(i_row[k], questions, answers);
                    
                    var td = document.createElement("td");
                    td.innerHTML = text;

                    // styling
                    if (k == 0)
                        td.style.textAlign = "left";
                    else if (k == i_row.length - 1)
                        td.style.textAlign = "right";
                    else
                        td.style.textAlign = "center";
                    
                    tr.appendChild(td);
                }
                
                table.appendChild(tr);
            }

            // styling
            table.className = "table";
            
            page_wrapper.appendChild(table);
        }
        else if (recommendation.paragraphs[i].type == "hr") // create horizontal line
        {
            var hr = document.createElement("hr");

            // styling
            hr.style.width = "40%";
            hr.style.marginLeft = "0px";
            
            page_wrapper.appendChild(hr);
        }
        else {
            // create paragraph
            var paragraph = document.createElement("p");
            var i_paragraph = recommendation.paragraphs[i];
    
            // set margin-block-end
            if (i_paragraph["block"] == true)
            {
                paragraph.style.marginBlockEnd = "1em";
            }
            else
            {
                paragraph.style.marginBlockEnd = "0em";
            }
    
            paragraph.style.marginBlockStart = "0em";

            // set text
            var text = getText(i_paragraph["text"], questions, answers);

            
            paragraph.innerHTML += text;

            // styling
            paragraph.className = i_paragraph["type"]; // text or hint

            // square
            if (i_paragraph["square"] == true)
            {
                var square = document.createElement("div");
                square.className = "square";
                page_wrapper.appendChild(square);

                paragraph.style.display = "inline-block";
                paragraph.style.verticalAlign = "middle";

                if (i_paragraph["block"] == true)
                {
                    square.style.marginBlockEnd = "1em";
                }
            }
            
            page_wrapper.appendChild(paragraph);

            if (i_paragraph["square"] == true)
            {
                var line_break = document.createElement("br");
                page_wrapper.appendChild(line_break);
            }
        }
    }

    return true;
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

    // show title
    show(document.getElementById("title"));
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

    // hide title
    hide(document.getElementById("title"));

}

function firstResultPage(current_page_id, data) {
    hide(document.getElementById("page_" + current_page_id));
    hide(document.getElementById("back-button"));
    hide(document.getElementById("submit-button"));

    show(document.getElementById("next-button"));
    show(document.getElementById("page_" + (getFirstOfType("result"))));
    
    if (getFirstOfType("result") == getLastOfType("result"))
    {
        show(document.getElementById("print-button"))
        hide(document.getElementById("next-button"));
    }

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

    if (current_page_id == data.length-1 || (current_page_id == data.length-2 && checkCriterias(data, current_page_id+1) == false)) // Pre-Submit Page
    {
        hide(document.getElementById("next-button"));
        show(document.getElementById("submit-button"));
        document.getElementById("subtitle").innerHTML = "Checkliste";
    }
    else
    {
        // hide submit button
        hide(document.getElementById("submit-button"));
    }

    if (current_page_id+1 == getLastOfType("result"))
        show(document.getElementById("print-button"));
    
    if (current_page_id+1 < data.length && checkCriterias(data, current_page_id+1) == false) // skip Page if condition is not met
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

    if (current_page_id == getLastOfType("pre-submit")) // previous page is pre-submit page
    {
        hide(document.getElementById("submit-button"));
        document.getElementById("subtitle").innerHTML = "Fragenkatalog";
    }

    if (current_page_id == getLastOfType("result")) // last page was last result page
        hide(document.getElementById("print-button"));

    if (current_page_id-1 == getFirstOfType("result")) // result page
    {
        firstResultPage(current_page_id, data);
        return current_page_id-1;
    }

    if (current_page_id-1 < data.length && checkCriterias(data, current_page_id-1) == false) // skip Page if condition is not met
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
        answers[i] = [];
        for (var j = 0; j < data[i].answers.length; j++)
        {
            var answer = document.getElementById(getFirstQuestionIndexOfPage(i, data) + j).querySelector("input");

            if (data[i].answer_type == "single" || data[i].answer_type == "multi")
                answers[i][j] = answer.checked;
            else
                answers[i][j] = answer.value;
        }
    }
    return answers;
}

function getFirstQuestionIndexOfPage(page_id, data) {
    var index = 0;
    for (var i = 0; i < page_id; i++)
        index += data[i].answers.length;
    return index;
}

function getDataId(id, data) { // Convert id of answer div to [question, answer] index
    var index = 0;
    var result = [];
    for (var i = 0; i < data.length; i++)
    { // go through questions
        for (var j = 0; j < data[i].answers.length; j++)
        { // go through answers
            if (index == id)
                return [i, j];
            index++;
        }
    }
    return null;
}

function getText(i_paragraph, questions, answers) {
    var textResult = "";
    for (var j = 0; j < i_paragraph.length; j++) // j = nth text element in one paragraph
    {
        var type = i_paragraph[j].type;

        var text_criterias = (i_paragraph[j].criterias == null) ? [] : i_paragraph[j].criterias;
        if (text_criterias.length != 0 && checkResultCriterias(text_criterias, questions, answers) == false)
            continue;

        if (type == "var") // variable
        {
            if (i_paragraph[j].question != null) // question
            { // array answer
                var question = i_paragraph[j].question;
                if (questions[question].answer_type == "single")
                {
                    for (var k = 0; k < answers[question].length; k++) // k = nth answer
                    {
                        if (answers[question][k] == true) // if the answer is true
                        {
                            if (i_paragraph[j].aliases != null) // if there is an alias
                            {
                                text = i_paragraph[j].aliases[k];
                            }
                            else
                            {
                                text = questions[question].answers[k];
                            }
                            break;
                        }
                    }
                }
                else if (questions[question].answer_type == "multi")
                {
                    var text = "";
                    for (var k = 0; k < answers[question].length; k++)
                    {
                        if (answers[question][k] == true) // if the answer is true
                        {
                            if (i_paragraph[j].aliases != null) // if there is are aliases
                            {
                                text += i_paragraph[j].aliases[k];
                            }
                            else
                            {
                                text += questions[question].answers[k];
                            }
                            text += i_paragraph[j].separator;
                        }
                    }
                    text = text.substring(0, text.length - i_paragraph[j].separator.length);
                }

                if (text == parseInt(text) && questions[question].answer_type == "number")
                    text = formatNumber(parseInt(text));
            }
            else if (i_paragraph[j].id != null) // only textfield answer
            {
                var x = i_paragraph[j].id[0];
                var y = i_paragraph[j].id[1];
                var text = answers[x][y];

                if (text == parseInt(text) && questions[x].answers[y].type == "number")
                    text = formatNumber(parseInt(text));
            }

            // style
        }
        else if (type == "string") // text
        {
            var text = i_paragraph[j].string;
        }
        else if (type == "calc") // calculation
        {
            var operator = i_paragraph[j].operator;
            var result = 0;
            for (var k = 0; k < i_paragraph[j].values.length; k++)
            {
                // get value
                if (i_paragraph[j].values[k].id != null) // question
                {
                    var x = i_paragraph[j].values[k].id[0];
                    var y = i_paragraph[j].values[k].id[1];
                    var value = answers[x][y];
                }
                else if (i_paragraph[j].values[k].value != null) // number
                {
                    var value = i_paragraph[j].values[k].value;
                }
                else
                {
                    var value = 0;
                }

                if (k == 0)
                {
                    result = value;
                }
                else
                {
                    if (operator == "+")
                    {
                        result += value;
                    }
                    else if (operator == "-")
                    {
                        result -= value;
                    }
                    else if (operator == "*")
                    {
                        result *= value;
                    }
                    else if (operator == "/")
                    {
                        result /= value;
                    }
                }
            }

            if (i_paragraph[j].addToResult != null)
            {
                if (i_paragraph[j].addToResult.id != null) // question
                {
                    var x = i_paragraph[j].addToResult.id[0];
                    var y = i_paragraph[j].addToResult.id[1];
                    var addValue = answers[x][y];
                }
                else if (i_paragraph[j].addToResult.value != null) // number
                {
                    var addValue = i_paragraph[j].values[k].value;
                }
                result = parseInt(result) + parseInt(addValue);
            }

            var text = result;

            if (text == parseInt(text))
                text = formatNumber(parseInt(text));
        }
        else if (type == "br") // line break
        {
            var text = "<br>";
        }
        textResult += text;
    }
    return textResult;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}