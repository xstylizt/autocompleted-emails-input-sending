$(document).ready(function(){

    // Input box
    const inputEmail = $('#email')

    // Autosuggestion email list
    const emailList = $('#emails-list')

    // Current status
    const statusSpan = $('.details span')

    // Submit button
    const submitBtn = $('#submit-btn');


    // Cursor on input box initially 
    inputEmail.focus();

    $(document).on('click',function(ev){
        const emailBox = $('#emails-box')
        inputEmail.focus();
        if(!$(ev.target).is(inputEmail)){
            emailBox.css('caret-color','transparent')
        }
        else{
            emailBox.css('caret-color','')
        }
    });

    // Define .remove() function is like python .remove() which is used with list
    Array.prototype.remove = function(element) {
        const index = this.indexOf(element);
        if (index !== -1) {
                this.splice(index, 1);
        }
    };

    // ------------------------------- Defind function create Email tags ----------------------------------------------------------

    // Array which is retrieved duplicated email for filtering on autosuggestion (It is used for sending to database too) 
    let emailCheckDuplicatedArray = Array.from(new Set([]));

    function createEmailDiv(emailAddress) {
        const emailSpan = $('<span>', { text: emailAddress.toLowerCase(), class: 'emailAdd', tabindex: '1' });
        const emailDiv = $('<div>', { class: 'emailDiv' });
        const deleteButton = $('<button>', { text: 'X', class: 'deleteBtn' });

        deleteButton.on('click', function () {
              const emailClickDeleted = $(this).siblings('span').text()
              emailCheckDuplicatedArray.remove(emailClickDeleted)
              $(this).parent().remove(); 
              statusSpan.empty();
              statusSpan.append('Current status: <span style="color: #ff0000; font-weight: 500;">Email is completely removed!</span> ❌');
        });

        emailDiv.find('input').on('keydown', function (ev) {
              if (ev.which === 8 && !$(this).val()) {
                $(this).closest('.emailDiv').remove();
              }
        });

        emailDiv.append(emailSpan, deleteButton);
        return emailDiv
    }

    // ---------------------------------------------------------------------------------

                // Define function for bolding the text 
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }


    function getBoldedText(email, search) {
        const escapedSearch = escapeRegExp(search);
        const regex = new RegExp('^' + escapedSearch, 'i');
        return email.replace(regex, match => `<b>${match}</b>`);
    }

    /* ----------------------------------------------------------------------------- */

    // Defind function for checking duplicated emails
    function isDuplicateEmail(email) {
        const emailLowerCase = email.toLowerCase();
        const emailAdd =$('#emails-box .emailAdd');
        let isDuplicate = false;

        emailAdd.each(function () {
            if ($(this).text().toLowerCase() === emailLowerCase) {
                isDuplicate = true;
                return false; 
            }
        });

        return isDuplicate;
    }

    // ------------------------------------------------------------------------------------------------- 


    // Define function for fetching inserted email

    function fetchInsertedEmails() {
        $.ajax({
            type: "POST",
            url: "/retrieve_email",
            success: function (response)    {
                response.forEach(function (item){
                    const emailDiv = createEmailDiv(item[0]);
                    emailDiv.insertBefore('.autocompleted'); 
                })
            },
            error: function (error) {
                    console.error("Error:", error);
                }
        });
    }  

    // --------------------------------------------------------------------------------------------------


     // Handle the event of input box which is about [Enter, Backspace, Click]

    let selectedSuggestionIndex = -1;
    let emailEnteredIndexCounter = 1;
    // let emailBackspaceDeletedArray = Array.from(new Set([]));
    inputEmail.on({
        keyup: function (ev) {
            const singleEmailonList = $('#emails-list li');

            if (/(13|32)/.test(ev.which) && this.value) {
                const enterCheckEmail = this.value

                if (enterCheckEmail !== '') {
                    if(!isDuplicateEmail(enterCheckEmail)){
                        const emailDiv = createEmailDiv(enterCheckEmail);
                        emailDiv.insertBefore('.autocompleted'); 
                        inputEmail.val('')
                    }
                    else{
                         inputEmail.val('')
                    }
                }

                emailList.empty();

                inputEmail.focus();

            }

            const emailDiv = $("#emails-box .emailDiv")
            const emailDivHasClass = $("#emails-box .emailDiv").last().hasClass("focusTag");
                if (/8/.test(ev.which)) {
                    if (!this.value) {
                        const emailBackspaceDeleted = emailDiv.last().find('span').text();
                        // emailBackspaceDeletedArray.push(emailBackspaceDeleted)
                        emailCheckDuplicatedArray.remove(emailBackspaceDeleted)
                        console.log(emailCheckDuplicatedArray)

                        if(inputEmail.val() === "" && emailDivHasClass){
                            statusSpan.empty();
                            statusSpan.append('Current status: <span style="color: #ff0000; font-weight: 500;">Email is completely removed!</span> ❌');
                        }
                        else{
                            statusSpan.html('<span>Current status: </span>')
                        }
                        if (emailDivHasClass) {
                            // If the input field is empty and the last email tag has focusTag class
                            // then remove the last emailDiv
                                /* removeEmailFromDatabase(emailBackspaceDeleted) */
                                emailDiv.last().remove();
                            }
                        else {
                                emailDiv.last().addClass("focusTag");
                                statusSpan.empty();
                                statusSpan.append('Current status: <span style="color: #ff0000; font-weight: 500;">Email is completely removed!</span> ❌');
                        }
                    }
                }

                // Handle arrow key (up and down) navigation for the suggestions
                if (/(38|40|37|39)/.test(ev.which) && singleEmailonList.length) {
                    const numSuggestions = singleEmailonList.length;
                    const suggestionHeight = $(singleEmailonList[0]).outerHeight(); // Height of a single suggestion
                    const listHeight = emailList.height(); // Height of the suggestion list container

                    if (ev.which === 38) {
                        // Up Arrow
                        selectedSuggestionIndex = (selectedSuggestionIndex - 1 + numSuggestions) % numSuggestions;
                    } else if (ev.which === 40) {
                        // Down Arrow
                        selectedSuggestionIndex = (selectedSuggestionIndex + 1) % numSuggestions;
                    } else if (ev.which === 37) {
                        // Left Arrow
                        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
                    } else if (ev.which === 39) {
                        // Right Arrow
                        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, numSuggestions - 1);
                    }

                    if (ev.which !== 37 && ev.which !== 39) {
                        singleEmailonList.removeClass('selected');
                        $(singleEmailonList[selectedSuggestionIndex]).addClass('selected');
                      }


                    const visibleAreaTop = emailList.scrollTop();
                    const visibleAreaBottom = visibleAreaTop + listHeight;
                    const suggestionTop = suggestionHeight * selectedSuggestionIndex;
                    const suggestionBottom = suggestionTop + suggestionHeight;

                    if (suggestionTop < visibleAreaTop) {
                        // The selected suggestion is above the visible area
                        emailList.scrollTop(suggestionTop);
                    } else if (suggestionBottom > visibleAreaBottom) {
                        // The selected suggestion is below the visible area
                        emailList.scrollTop(suggestionBottom - listHeight);
                    } 
                }

            },

        keydown: function (ev) {
            // Handle Enter key press to select the suggestion
            if (ev.which === 13) {
                const singleEmailonList = $('#emails-list li');
                if (singleEmailonList.length && selectedSuggestionIndex >= 0) {
                    const selectedSuggestion = singleEmailonList[selectedSuggestionIndex];
                    const email = $(selectedSuggestion).text();
                    emailCheckDuplicatedArray.push(email)
                    emailEnteredIndexCounter++;
                    inputEmail.val(email);  
                    statusSpan.empty();
                    statusSpan.append('Current status: <span style="color: #00b300; font-weight: 500;">Email is completely added!</span> ✅');
                }
            }
        },
    });


    /* ------------------------------------------------------------------------------------------------- */

    /* ------- Function for recieving email from user input and filter from database via API with AJAX */

    let invalidState = false; // Variable to track if input is in invalid state
    inputEmail.on("input", function (e) {
        emailboxSearch = inputEmail.val();
        if (emailboxSearch.length >= 1) {
            $.ajax({
                method: "POST",
                url: "/emailsearch",
                data: { email: emailboxSearch },
                success: function (res) {
                    const isMatchEmail = res.flat().some(email => email.includes(emailboxSearch));
                    if (isMatchEmail) {
                        const filteredEmails = res.flat().filter(email => !emailCheckDuplicatedArray.includes(email));
                        emailList.empty();
                        filteredEmails.forEach(function (email) {
                            const li = $("<li>").html(getBoldedText(String(email), emailboxSearch));
                            emailList.append(li);
                        });
                        if (invalidState) {
                            $('.details').find('span').text('Current status: No action');
                                invalidState = false;
                        }
                        } else {
                            emailList.empty();
                            statusSpan.empty();
                            statusSpan.append('Current status: <span style="color: #ff0000; font-weight: 500;">Not found email on database</span> ❌');
                            invalidState = true;
                        }
                    }
                });
            } else {
                emailList.empty();
                $('.details').find('span').text('');
                invalidState = false;
            }
    });

    /* ------------------------------------------------------------------------------------------------- */

    // Handle the event of each email (li tags) on ui (click)

    let emailBackspaceIndexCounter = 1;
    emailList.on('click', 'li', function () {
        const clickedEmail = $(this).text().trim();
        emailCheckDuplicatedArray.push(clickedEmail)
        console.log(emailCheckDuplicatedArray)

        if (clickedEmail !== '' && !isDuplicateEmail(clickedEmail)) {
            const emailDiv = createEmailDiv(clickedEmail);
            emailDiv.insertBefore('.autocompleted');
            statusSpan.empty();
            statusSpan.append('Current status: <span style="color: #00b300; font-weight: 500;">Email is completely added!</span> ✅');
        } else {
            inputEmail.val('')
        }

        emailBackspaceIndexCounter++;

        if(inputEmail.val() === ""){
                statusSpan.html('Current status: <span style="color: #ff0000; font-weight: 500;">Not found email on database</span> ❌')
        }

        inputEmail.val('');

        emailList.empty();

        inputEmail.focus();
    });

     /* ------------------------------------------------------------------------------------------------- */

    // Handle the event of submit button (click)

    submitBtn.on('click', function (e) {
        e.preventDefault(); 
        Swal.fire({
            title: 'Are you sure for submitting?',
            text: 'If you are not sure, please recheck email before',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, submit!',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            cancelButtonText: 'No, cancel!',
        }).then((result) => {
            if (result.isConfirmed) {
                const mappedArray = emailCheckDuplicatedArray.map((email, index) => {
                    return {
                        id: index + 1,
                        email: email
                    };
                });

                $.ajax({
                    type: "POST",
                    url: "/insert_email",
                    contentType: "application/json",
                    data: JSON.stringify({ emails: mappedArray }),
                    success: function (response) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: 'Emails sumbmitted successfully.',
                            timer: 3500 
                        });
                    },
                    error: function (error) {
                        console.error("Error:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: 'An error occurred while inserting emails.',
                            confirmButtonText: 'OK'
                        });
                    }
                });

                statusSpan.empty();
                statusSpan.append('Current status: <span style="color: #00b300; font-weight: 500;">Summit successfully!</span> ✅');

            } else if (result.dismiss === Swal.DismissReason.cancel) {
                statusSpan.empty();
                statusSpan.append('Current status: <span style="color: #ff0000; font-weight: 500;">Cancel summitting!</span> ❌');
            }
        });
    });

    /* ------------------------------------------------------------------------------------------------- */


    /*
    // Define function for removing email from database
    function removeEmailFromDatabase(email){
        $.ajax({
            type: "POST",
            url: "/remove_email",
            contentType: "application/json",
            data: JSON.stringify({ email: email }),
            success: function (response) {
                if (response.success) {
                console.log(response.message);
                // Update the email divs after removing an email
                } else {
                console.error(response.message);
                }
            },
            error: function (error) {
                console.error("Error:", error);
            }
            });
    }
    */

     /* ------------------------------------------------------------------------------------------------- */

    fetchInsertedEmails();
})
