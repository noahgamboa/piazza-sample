(function(window, document, undefined) {

    // pane elements
    var rightPane = document.getElementById('right-pane');
    var leftPane = document.getElementById('left-pane');

    // button and input elements
    var newQuestionButton = document.querySelector('a[class="btn"]');
    var searchInput = document.querySelector('input[name="search"]');

    // script elements that correspond to Handlebars templates
    var questionFormTemplate = document.getElementById('question-form-template');
    var questionsTemplate = document.getElementById('questions-template');
    var expandedQuestionTemplate = document.getElementById('expanded-question-template');

    // compiled Handlebars templates
    var templates = {
        renderQuestionForm: Handlebars.compile(questionFormTemplate.innerHTML),
	renderQuestions: Handlebars.compile(questionsTemplate.innerHTML),
	renderExpandedQuestion: Handlebars.compile(expandedQuestionTemplate.innerHTML)
    };
    /* Returns the questions stored in localStorage. */
    function getStoredQuestions() {
        if (!localStorage.questions) {
            // default to empty array
            localStorage.questions = JSON.stringify([]);
        }

        return JSON.parse(localStorage.questions);
    }

    /* Store the given questions array in localStorage.
     *
     * Arguments:
     * questions -- the questions array to store in localStorage
     */
    function storeQuestions(questions) {
        localStorage.questions = JSON.stringify(questions);
    }

    // TASK 1:
    // display question form initially
    rightPane.innerHTML = templates.renderQuestionForm();

    //this event listener is for the "submit" button on the question form. When a user clicks submit question, it will go here
    rightPane.addEventListener("click", function(event) {
    var target = event.target;
    var submit = rightPane.querySelector('input[value="Submit"]');
	if(target === submit)
	{
	     	event.preventDefault();
		var questionForm = rightPane.querySelector('form[id="question-form"]');
		var subjectObject = questionForm.querySelector('input[name="subject"]');
		var questionObject = questionForm.querySelector('textarea[name="question"]');
		updateQuestionList(subjectObject, questionObject);
	}
    });

    //this function will actually add the question to both the left pane and local storage, if the question is valid
    function updateQuestionList(subjectObject, questionObject) {	    
	if(subjectObject.value && questionObject.value) {
		var newQuestion = { 
			id: Math.random(),
			subject: subjectObject.value,
			question: questionObject.value,
			responses: []
		};
		subjectObject.value = "";
		questionObject.value = "";
		removePlaceholder();
		appendQuestionToLeftPane(newQuestion);
		appendQuestionToLocalStorage(newQuestion);
	}
    }	
    //this function will append a question to local storage 
    function appendQuestionToLocalStorage(newQuestion) {
	var newQuestions = getStoredQuestions();
	newQuestions.push(newQuestion);
	storeQuestions(newQuestions);
    }
    //this function will append a question the left pane
    function appendQuestionToLeftPane(newQuestion) {
	var li = document.createElement('li');
	li.innerHTML = templates.renderQuestions({questions: [newQuestion]});
	leftPane.appendChild(li);
    }
    //if there is a placeholder, meaning a list object displaying that there are no questions, then remove it to add question
    function removePlaceholder() {
	var possiblePlaceholder = leftPane.querySelector('div[class="list-question"]');
	if(possiblePlaceholder !== null && possiblePlaceholder.children.length < 2) {
		var li = possiblePlaceholder.parentNode;
		li.parentNode.removeChild(li);
	}

    }

    //TASK 2:
    //this variable will store the current expanded question, it will be undefined otherwise.
    var expandedQuestion;

    //this function adds an event listener to the entire left pane. by event delegation, it will find which question is clicked.
    leftPane.addEventListener("click", function(event) {
	var target = event.target;
	while(target.tagName !== "LI") target = target.parentNode;
	if(target.querySelector('div').children.length > 1) {
		var questions = getStoredQuestions();
		var id = target.querySelector('div').id;
		expandedQuestion = questions[getIndex(questions, id, "id")];
		expandQuestion();
	}
    });
    //this function will expand the question into the pane on the right and update event listeners.
    function expandQuestion() {
	rightPane.innerHTML = templates.renderExpandedQuestion(expandedQuestion);
	addEventListenerToResponseSubmit();
	addEventListenerToResolveButton();
    }

    //TASK 3:
    //this function will show the new question form when the user clicks new question
    newQuestionButton.addEventListener("click", function(event) {
    	rightPane.innerHTML = templates.renderQuestionForm();
    });

    //TASK 4:
    //this function adds the event listener to the response button. it will then add responses to questions
    function addEventListenerToResponseSubmit() {
	var responseSubmit = rightPane.querySelector('input[type="submit"]');
	responseSubmit.addEventListener("click", function(event) {
		event.preventDefault();
		updateResponses();
	});
    }
    //this function will update the responses if there is a name and value in the response list.
    function updateResponses() {
	var responseForm = rightPane.querySelector('form[id="response-form"]');
	var name = responseForm.querySelector('input[type="text"]');
	var response = responseForm.querySelector('textarea[type="text"]');
	if(name.value && response.value) {
		appendResponseToResponseList(name.value, response.value);
		expandQuestion();
	}
    }
    //this function will update the response list in the expanded question pane
    function appendResponseToResponseList(newname, newresponse) {
	var questions = getStoredQuestions();
	var index = questions.indexOf(expandedQuestion);
	expandedQuestion.responses.push({name: newname, response: newresponse});
	questions[getIndex(questions, expandedQuestion.id, "id")] = expandedQuestion;
	storeQuestions(questions);
    }

    //TASK 5
    //this function will add an event listener to the resolve button. when clicked it will remove the question
    function addEventListenerToResolveButton() {
	var resolveButton = rightPane.querySelector('a[class="resolve btn"]');
	resolveButton.addEventListener("click", function(event) {
		event.preventDefault();
		removeQuestionFromLocalStorage();
		removeQuestionFromSidebar();
		updateWindowAfterResolve();
	});
    }
    //this function will remove the question from local storage
    function removeQuestionFromLocalStorage() {
	var questions = getStoredQuestions();
	var pos = getIndex(questions, expandedQuestion.id, "id");
	questions.splice(pos, 1);
	storeQuestions(questions);
    }
    //this function will remove the question from the sidebar
    function removeQuestionFromSidebar() {
	var id = expandedQuestion.id.toString();
	var questionItem = leftPane.querySelector('div[id="' + id + '"]');
	var li = questionItem.parentNode;
	li.parentNode.removeChild(li);
    }
    //this function will add the question form back to the right pane and possibly add the temporary question. 
    function updateWindowAfterResolve() {
	rightPane.innerHTML = templates.renderQuestionForm();
	if(getStoredQuestions().length < 1) addTemporaryQuestion();
    }	

    //EXTENSION - SEARCH
    //this variable represents the search bar
    var searchBar = document.querySelector('input[type="text"][name="search"]');
    //this will add an event listener to the search bar that will allow the user to search the question list
    searchBar.addEventListener('keyup', function(event) {
	 var searchTerm = searchBar.value.toLowerCase();
	 var questions = getStoredQuestions();
	 var remainingQuestions = questions.filter(function(question) {
		 return foundSearchTermInQuestion(question,searchTerm);
	 });
	 filterLeftPane(remainingQuestions);
	 removeExpandedQuestion(remainingQuestions);
    });
    //this function will filter the items in the search pane as the user types
    function filterLeftPane(remainingQuestions) {
	 leftPane.innerHTML = '';

	 remainingQuestions.forEach(function(question) {
		var li = document.createElement('li');
		li.innerHTML = templates.renderQuestions({questions: [question]});
		leftPane.appendChild(li);
	 });
    }

    //this function will find the questions according to the search pane and return them.
    function foundSearchTermInQuestion(question, searchTerm) {
	 if(question.subject.toLowerCase().indexOf(searchTerm) !== -1 
	 || question.question.toLowerCase().indexOf(searchTerm) !==-1) {
		return true;
	 }
	 else return false;
    }
    //this function will remove the expanded question if it is not in the remaining questions
    function removeExpandedQuestion(remainingQuestions) {
	 if(expandedQuestion !== undefined && getIndex(remainingQuestions, expandedQuestion.id, "id") === -1) {
		rightPane.innerHTML = templates.renderQuestionForm();
		return false;
	 }
    }


    //Show questions on leftpane if there are already questions in local sorage
    var questionList = getStoredQuestions();
    if(questionList.length !== 0) {
	addQuestions(questionList);
    }
    else { 
	addTemporaryQuestion();
    }
    //this function will add questions from local storage to the event list
    function addQuestions(questionList) {
        questionList.forEach(function(question) {
        	var li = document.createElement('li');
        	li.innerHTML = templates.renderQuestions({questions: [question]});
        	leftPane.appendChild(li);
	});
    }
    //this function adds a temporary question to the event list
    function addTemporaryQuestion() {
	var li = document.createElement('li');
	li.innerHTML = templates.renderQuestions({questions: null});
	leftPane.appendChild(li);
    }

    //this helper function will find an object in an array based on its property.
    function getIndex(arr, toFind, property) {
	for(var i = 0; i < arr.length; i++) 
		if (arr[i][property] == toFind) //I use "==" because the numbers are different types	
			return i;
	return -1;
    }


})(this, this.document);
