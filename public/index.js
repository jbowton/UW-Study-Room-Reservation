/**
 * Name: Jadon Bowton
 * Date: 6/4/2023
 * Section: CSE 154 AC
 *
 * This is the javascript that handles the functionality of the login and create new
 * user page. With it, users can login to their account or create a new account and then
 * login with it, giving them access to the Quiet Quarters study room reservation site.
 */

'use strict';
(function() {
  window.addEventListener("load", init);

  /**
   * This function sets up the page makes the buttons clickable.
   */
  function init() {
    let loginPage = id('login-page');
    let createPage = id('create-page');
    setHomeBtns(loginPage, createPage);
    setLoginBtns(loginPage, createPage);
    setSubmitBtns(loginPage, createPage);
    focusSet();
  }

  /**
   * This function gets the username of the most recently logged in user and
   * autofills the login username.
   */
  function getSetUsername() {
    let username = localStorage.getItem("username");
    if (username) {
      id('email').value = username;
    }
  }

  /**
   * This function makes the buttons in the navigation bar clickable, and make
   * sure they achieve the desired behavior of changing the view/information for
   * the user.
   * @param {String} loginPage - The login in page
   * @param {String} createPage - The create new user page
   */
  function setHomeBtns(loginPage, createPage) {
    let home = id('home');
    let login = id('login');
    let homePage = id('home-page');
    home.addEventListener('click', () => {
      openClose(homePage, loginPage, createPage);
      clearFields(loginPage);
      clearFields(createPage);
    });
    login.addEventListener('click', () => {
      handleLoginEvents(loginPage, homePage, createPage);
    });
  }

  /**
   * This function handles the login page button events
   * @param {HTMLElement} loginPage - The login in page
   * @param {HTMLElement} homePage - The home page
   * @param {HTMLElement} createPage - The create new user page
   */
  function handleLoginEvents(loginPage, homePage, createPage) {
    openClose(loginPage, homePage, createPage);
    clearFields(loginPage);
    getSetUsername();
    setFields(loginPage);
    clearFields(createPage);
  }

  /**
   * This funciton sets up the buttons on the login page and makes sure information
   * on each page is cleared or filled.
   * @param {String} loginPage - The log in page.
   * @param {String} createPage - The create new user page.
   */
  function setLoginBtns(loginPage, createPage) {
    let newUser = id('new');
    let backLogin = id('back');
    newUser.addEventListener('click', () => {
      openClose(createPage, loginPage, null);
      setFields(createPage);
      clearFields(loginPage);
    });
    backLogin.addEventListener('click', () => {
      handleBackLoginEvents(loginPage, createPage);
    });
  }

  /**
   * This funciton handles the event when a user navigates from the create page to
   * the login page.
   * @param {HTMLElement} loginPage - The log in page.
   * @param {HTMLElement} createPage - The create new user page.
   */
  function handleBackLoginEvents(loginPage, createPage) {
    openClose(loginPage, createPage, null);
    getSetUsername();
    setFields(loginPage);
    clearFields(createPage);
  }

  /**
   * This function sets up the buttons within the login page or create new user
   * page. When a user submits a login or creates a new user, this is where it is
   * handled.
   * @param {String} loginPage - The log in page.
   * @param {String} createPage - The create new user page.
   */
  function setSubmitBtns(loginPage, createPage) {
    createPage.addEventListener('submit', function(event) {
      event.preventDefault();
      handleCreate();
    });
    loginPage.addEventListener('submit', function(event) {
      event.preventDefault();
      handleLogin();
    });
  }

  /**
   * This function handles a login from a user and handles the result of a login.
   * If a user's email and password matches, the user will be logged in.
   */
  async function handleLogin() {
    const endpoint = '/library/login';
    let email = id('email').value;
    let key = id('password').value;
    let data = new FormData();
    data.append("email", email);
    data.append("key", key);
    try {
      let result = await fetch(endpoint, {method: 'POST', body: data});
      await statusCheck(result);
      result = await result.json();
      handleNewLogin(result);
    } catch (err) {
      handleError(err.message, 'login-page');
    }
  }

  /**
   * This function ensures that when a user is logged in, the information they
   * see matches that of their account.
   * @param {JSON} res - The users id, email, and username.
   */
  function handleNewLogin(res) {
    if (res) {
      clearError('login-page');
      localStorage.clear();
      localStorage.setItem("id", res.id);
      localStorage.setItem("name", res.name);
      localStorage.setItem("email", res.username);
      window.location.replace("main.html");
    }
  }

  /**
   * This function creates a new user when someone creates a new account. It will
   * create a new account using the name, email, and password provided by the user.
   */
  async function handleCreate() {
    const endpoint = '/library/users/new';
    let name = id('name').value;
    let email = id('create-email').value;
    let key = id('create-password').value;
    let data = new FormData();
    data.append("name", name);
    data.append("email", email.toLowerCase());
    data.append("key", key);
    try {
      let result = await fetch(endpoint, {method: 'POST', body: data});
      await statusCheck(result);
      result = await result.json();
      handleNewUser(result);
    } catch (err) {
      handleError(err.message, 'create-page'); // change here
    }
  }

  /**
   * This function returns the user to the login in page once their account has been
   * successfully created.
   */
  function handleNewUser() {
    let loginPage = id('login-page');
    let createPage = id('create-page');
    clearError('create-page');
    openClose(loginPage, createPage);
    setFields(loginPage);
    clearFields(createPage);
  }

  /**
   * This function removes errors from the login page or create new user page once
   * a new submission has been entered for either.
   * @param {String} page - The page to clear the error.
   */
  function clearError(page) {
    let error = qs('#' + page + ' .error');
    error.innerHTML = '';
  }

  /**
   * This function displays error messages for the user when their login or
   * new user creation results in an error due to input or server side issues.
   * @param {String} err - The error to be displayed.
   * @param {String} page - The HTML element that needs to be updated.
   */
  function handleError(err, page) {
    let currentPage = id(page);
    let error = qs('#' + page + ' .error');
    clearFields(currentPage);
    setFields(currentPage);
    error.textContent = err;
  }

  /**
   * This function clears the inputs on the login page and create new user page.
   * @param {String} page - The page to clear text entries.
   */
  function clearFields(page) {
    id("sign-error").innerHTML = '';
    let inputs = qsa('#' + page.id + ' input');
    for (let i = 0; i < inputs.length; i++) {
      inputs[i].value = '';
    }
  }

  /**
   * This function ensures that the placeholders are in the correct location for
   * user input locations and handles their animations.
   * @param {String} page - The page to handle placeholder animations.
   */
  function setFields(page) {
    const padding = 8;
    let labels = qsa('#' + page.id + ' div');
    let oneInput = qsa('#' + page.id + ' input');
    for (let i = 0; i < labels.length; i++) {
      let height = '';
      if (oneInput[i].value === '') {
        height = oneInput[i].offsetHeight - padding;
      } else {
        height = -padding;
      }
      labels[i].style.transform = 'translateY(' + height + 'px)';
    }
  }

  /**
   * This function is responsible for functionality when a user clicks on an input
   * box on either the login page or create new user page and triggers placeholder
   * animations.
   * @param {String} page - The page to trigger placeholder animations.
   */
  function focusSet() {
    let fields = qsa('input');
    for (let i = 0; i < fields.length; i++) {
      fields[i].addEventListener('focusin', handleInAnim);
      fields[i].addEventListener('focusout', handleBackAnim);
    }
  }

  /**
   * This function animates the placeholder into a input box when no value is present.
   */
  function handleInAnim() {
    let div = this.previousElementSibling;
    div.style.transform = 'translateY(-8px)';
  }

  /**
   * This function animates the placeholder out of a input box when a user enters their
   * information.
   */
  function handleBackAnim() {
    const padding = 8;
    let div = this.previousElementSibling;
    let height = this.offsetHeight - padding;
    if (!this.value) {
      div.style.transform = 'translateY(' + height + 'px)';
    }
  }

  /**
   * Checks the result of the fetch and its status code.
   * @param {JSOn} res - The JSON object that needs to be validated
   * @returns {JSON} - Returns the JSON object if it's status is validated.
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   *   * This function hides and unhides parts of the page depending on which button
   * the user has clicked in the navigation bar.
   * @param {HTMLElement} open - The section to unhide
   * @param {HTMLElement} close - The section to hide
   * @param {HTMLElement} closeTwo - The other section to hide.
   */
  function openClose(open, close, closeTwo) {
    open.classList.remove('hide');
    close.classList.add('hide');
    if (closeTwo) {
      closeTwo.classList.add('hide');
    }
  }

  /**
   * Selects an element based on its id.
   * @param {String} id - Id of element to select.
   * @returns {HTMLElement} - Returns a specific element depending on its id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Selects a list of elements based on a query.
   * @param {String} elements - Specifies the elements to be selected
   * @returns {DOMList} - Returns a list of all elements matching the given query.
   */
  function qsa(elements) {
    return document.querySelectorAll(elements);
  }

  /**
   * Helper function to select a specifc HTML element.
   * @param {String} element - Specifies the element to be selected
   * @returns {HTMLElement} - Returns a HTML element based on the query
   */
  function qs(element) {
    return document.querySelector(element);
  }
})();