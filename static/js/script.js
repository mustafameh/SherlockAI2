// static/js/script.js

function logout() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(response => {
        if (response.ok) {
            // Redirect to login page or home page after successful logout
            window.location.href = '/';
        } else {
            throw new Error('Logout failed');
        }
    })
    .then(() => {
        // Update UI after successful logout
        checkLoginStatus();
    })
    .catch(error => {
        console.error('Error during logout:', error);
    });
}

function loadCharacters() {
    fetch('/get_characters')
        .then(response => response.json())
        .then(characters => {
            const characterSelect = document.getElementById('character');
            characterSelect.innerHTML = ''; // Clear existing options

            characters.forEach(character => {
                const option = document.createElement('option');
                option.value = character.name;
                option.textContent = character.name;
                characterSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading characters:', error);
        });
}



document.addEventListener('DOMContentLoaded', () => {
    let currentChatId = null;
    let currentChat = [];
    let isNewChat = true;
    let currentCharacter = null;
    let currentModelSource = 'openrouter';
    const chatHistory = document.getElementById('chat-history');
    const apiMessage = document.getElementById('api-message');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const contextInput = document.getElementById('context');
    const characterSelect = document.getElementById('character');
    const temperatureInput = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperature-value');


    const createCharacterBtn = document.getElementById('create-character-btn');
    const customCharacterModal = document.getElementById('custom-character-modal');
    const customCharacterForm = document.getElementById('custom-character-form');
    const cancelCharacterBtn = document.getElementById('cancel-character');


    // Existing variables and functionality
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    const usernameDisplay = document.getElementById('username-display');
    const loginButton = document.getElementById('login-button');
    const dropdownUsername = document.getElementById('dropdown-username');
    const dropdownIcon = document.getElementById('dropdown-icon');


    // Toggle dropdown visibility
    userDropdown.addEventListener('click', () => {
        dropdownMenu.classList.toggle('hidden');
        dropdownIcon.classList.toggle('fa-caret-down');
        dropdownIcon.classList.toggle('fa-caret-up');
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!userDropdown.contains(event.target)) {
            dropdownMenu.classList.add('hidden');
            dropdownIcon.classList.add('fa-caret-down');
            dropdownIcon.classList.remove('fa-caret-up');
        }
    });

    let customCharacters = [];
    

    createCharacterBtn.addEventListener('click', () => {
        customCharacterModal.classList.remove('hidden');
    });

    cancelCharacterBtn.addEventListener('click', () => {
        customCharacterModal.classList.add('hidden');
    });
    customCharacterForm.addEventListener('submit', saveCustomCharacter);

    const addTraitBtn = document.querySelector('.add-trait-btn');
    const traitContainer = document.getElementById('custom-char-traits');

    addTraitBtn.addEventListener('click', addTraitInput);

    function addTraitInput() {
    const traitContainer = document.getElementById('custom-char-traits');
    const newTraitInput = document.getElementById('new-trait-input');
    const traitValue = newTraitInput.value.trim();
    
    if (traitValue) {
        const traitSpan = document.createElement('span');
        traitSpan.className = 'bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm flex items-center';
        traitSpan.innerHTML = `
            ${traitValue}
            <input type="hidden" name="traits" value="${traitValue}">
            <button type="button" class="ml-1 text-gray-500 hover:text-gray-700" onclick="this.parentElement.remove();">&times;</button>
        `;
        traitContainer.appendChild(traitSpan);
        newTraitInput.value = '';
    }
}

document.querySelector('.add-trait-btn').addEventListener('click', addTraitInput);
document.getElementById('new-trait-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTraitInput();
    }
});

    checkLoginStatus();
    
    checkInitialModelStatus();
    fetchCustomCharacters();
    updateUIForModelSource();
    
    // Check login status and adjust UI accordingly
    function checkLoginStatus() {
        fetch('/api/user')
            .then(response => response.json())
            .then(data => {
                if (data.logged_in) {
                    usernameDisplay.textContent = data.username;
                    dropdownUsername.textContent = data.username;
                    userDropdown.classList.remove('hidden');
                    loginButton.classList.add('hidden');
                } else {
                    userDropdown.classList.add('hidden');
                    loginButton.classList.remove('hidden');
                }
            })
            .catch(error => {
                console.error('Error checking login status:', error);
            });
    }


    // Add event listener for logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    


    function showCustomCharacterModal() {
        document.getElementById('custom-character-modal').classList.remove('hidden');
    }
    
    function hideCustomCharacterModal() {
        document.getElementById('custom-character-modal').classList.add('hidden');
        customCharacterForm.reset();
    }

    function saveCustomCharacter(event) {
        event.preventDefault();
        const name = document.getElementById('custom-char-name').value;
        const description = document.getElementById('custom-char-description').value;
        const relationship = document.getElementById('custom-char-relationship').value;
        const traits = Array.from(document.querySelectorAll('#custom-char-traits input[name="traits"]')).map(input => input.value);
        const speakingStyle = document.getElementById('custom-char-speaking-style').value;
        const sherlockApproach = document.getElementById('custom-char-sherlock-approach').value;

        const newCharacter = { name, description, relationship, traits, speakingStyle, sherlockApproach };
        
        fetch('/save_character', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCharacter)
        })
        .then(response => response.json())
        .then(data => {
            customCharacters.push(data);
            updateCharacterDropdown();
            hideCustomCharacterModal();
        })
        .catch(error => console.error('Error saving custom character:', error));
    }

    function fetchCustomCharacters() {
        fetch('/get_characters')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received characters:", data);  // Add this line
            customCharacters = data;
            updateCharacterDropdown();
        })
        .catch(error => console.error('Error fetching characters:', error));
    }





    function updateCharacterDropdown() {
        const characterSelect = document.getElementById('character');
        characterSelect.innerHTML = ''; // Clear all existing options
    
        // Dynamically add characters from the customCharacters array
        customCharacters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.name;
            option.textContent = character.name;
            characterSelect.appendChild(option);
        });
    
        console.log('Character dropdown updated dynamically.');
    }
    



    sendBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Add this line
        sendMessage();
    });


    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Add this line if not already present
            sendMessage();
        }
    });


    function updateTemperatureValue() {
        const value = temperatureInput.value;
        temperatureValue.textContent = value;
        temperatureInput.setAttribute('aria-valuenow', value);
    }
    
    temperatureInput.addEventListener('input', updateTemperatureValue);

    function sendMessage() {
        const userMessage = userInput.value.trim();
        if (userMessage) {
            const character = characterSelect.value;
            const context = contextInput.value.trim();
            const temperature = parseFloat(temperatureInput.value);
            
            // Check if character has changed
            if (character !== currentCharacter) {
                handleCharacterSwitch();
                return;
            }
    
            // Add user message to currentChat
            currentChat.push({ role: "user", content: userMessage });
            addMessageToChat('user', userMessage);
            userInput.value = '';
    
            if (currentModelSource === 'openrouter') {
                sendOpenRouterRequest(userMessage, temperature);
            } else {
                sendLocalModelRequest(userMessage, temperature);
            }
        }
    }
    function sendOpenRouterRequest(userMessage, temperature) {
        const apiKey = getApiKey();
        const model = getSelectedModel();
        if (!apiKey) {
            alert('Please set your API key in the settings.');
            return;
        }
    
        const apiMessages = currentChat.slice();
        const apiRequestBody = {
            model: model,
            messages: apiMessages,
            temperature: temperature,
            max_tokens: 1000,
        };
    
        apiMessage.textContent = `Sending to API: ${JSON.stringify(apiRequestBody, null, 2)}`;
        document.getElementById('loading-indicator').classList.toggle('hidden');
    
        fetch('/get_response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(apiRequestBody),
        })
        .then(response => response.json())
        .then(data => {
            handleModelResponse(data);
        })
        .catch(handleModelError);
    }
    
    // Add this function to your script.js
    function sendLocalModelRequest(userMessage, temperature) {
        const apiMessages = currentChat.slice();
        const apiRequestBody = {
            messages: apiMessages,
            temperature: temperature,
            max_tokens: 300,
        };
    
        apiMessage.textContent = `Sending to Local Model: ${JSON.stringify(apiRequestBody, null, 2)}`;
        document.getElementById('loading-indicator').classList.toggle('hidden');
    
        fetch('/local_model_inference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiRequestBody),
        })
        .then(response => response.json())
        .then(data => {
            handleModelResponse(data);
        })
        .catch(handleModelError);
    }



    
function handleModelResponse(data) {
    document.getElementById('loading-indicator').classList.toggle('hidden');
    const sherlockResponse = data.choices ? data.choices[0].message.content : data.response;
    addMessageToChat('assistant', sherlockResponse);
    currentChat.push({ role: "assistant", content: sherlockResponse });

    const lastMessage = chatHistory.lastElementChild;
    const audioButton = lastMessage.querySelector('.audio-button');
    audioButton.className = 'audio-button ready';
    audioButton.innerHTML = '▶️';
}
    
    function handleModelError(error) {
        document.getElementById('loading-indicator').classList.toggle('hidden');
        console.error('Error:', error);
        addMessageToChat('assistant', 'My apologies, I encountered an error in my deductions. If you are trying to access the Fine-Tuned Model please make sure you are logged in first.');
    }
    
    function checkAndLoadLocalModel() {
        checkInitialModelStatus();
    }
    
    const loadModelBtn = document.getElementById('load-local-model-btn');
    const unloadModelBtn = document.getElementById('unload-local-model-btn');

    loadModelBtn.addEventListener('click', loadLocalModel);
    unloadModelBtn.addEventListener('click', unloadLocalModel);








    function addMessageToChat(role, content) {
        if (role === 'system') return;
    
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message mb-4 p-3 rounded-lg ${
            role === 'user' 
                ? 'bg-blue-100 self-end rounded-br-none ml-12' 
                : 'bg-gray-100 self-start rounded-bl-none mr-12'
        }`;
        messageDiv.style.maxWidth = '72.5%'; // Ensures the message bubble doesn't exceed 50% of the chat window width
    
        const speakerSpan = document.createElement('span');
        speakerSpan.className = 'speaker font-bold text-blue-900 mr-2';
        speakerSpan.textContent = (role === 'user' ? `${currentCharacter || 'Dr. Watson'}:` : 'Sherlock Holmes:');
    
        const contentSpan = document.createElement('span');
        contentSpan.className = 'content';
        contentSpan.textContent = content;
    
        messageDiv.appendChild(speakerSpan);
        messageDiv.appendChild(contentSpan);
    
        if (role === 'assistant') {
            const audioButton = document.createElement('button');
            audioButton.className = 'audio-button ready';
            audioButton.innerHTML = '▶️'; // Play icon
            audioButton.onclick = () => handleAudio(content, audioButton);
            messageDiv.appendChild(audioButton);
        }
    
        const chatHistory = document.getElementById('chat-history');
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    
    
    function handleAudio(text, button) {
        const audioPlayer = document.getElementById('audio-player');
        
        if (button.className.includes('ready')) {
            // Start loading audio
            button.className = 'audio-button loading';
            button.innerHTML = '🔄'; // Loading icon
            fetchAudio(text, button, audioPlayer);
        } else if (button.className.includes('playing')) {
            // Pause audio
            audioPlayer.pause();
            button.innerHTML = '▶️'; // Play icon
            button.className = 'audio-button paused';
        } else if (button.className.includes('paused')) {
            // Resume audio
            audioPlayer.play();
            button.innerHTML = '⏸️'; // Pause icon
            button.className = 'audio-button playing';
        }
    }
    
    function fetchAudio(text, button, audioPlayer) {
        fetch('/text_to_speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({text: text}),
        })
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            audioPlayer.src = url;
            audioPlayer.oncanplaythrough = () => {
                button.className = 'audio-button playing';
                button.innerHTML = '⏸️'; // Pause icon
                audioPlayer.play();
            };
            audioPlayer.onended = () => {
                button.className = 'audio-button ready';
                button.innerHTML = '▶️'; // Play icon
            };
        })
        .catch(error => {
            console.error('Error fetching audio:', error);
            button.className = 'audio-button ready';
            button.innerHTML = '▶️'; // Play icon
        });
    }

const audioPlayer = document.getElementById('audio-player');
audioPlayer.addEventListener('ended', () => {
    const playingButton = document.querySelector('.audio-button.playing');
    if (playingButton) {
        playingButton.className = 'audio-button ready';
        playingButton.innerHTML = '▶️'; // Play icon
    }
});

async function saveCurrentChat() {
    if (currentChat.length === 0) {
        alert("No messages to save.");
        return;
    }

    // Find the first two non-system messages
    const nonSystemMessages = currentChat.filter(msg => msg.role !== "system");
    
    let title = "New Chat";
    let preview = "";

    if (nonSystemMessages.length > 0) {
        title = nonSystemMessages[0].content.substring(0, 30) + "...";
        if (nonSystemMessages.length > 1) {
            preview = nonSystemMessages[1].content;
        } else {
            preview = nonSystemMessages[0].content;
        }
    }

    const fullContent = JSON.stringify(currentChat);

    try {
        const url = currentChatId ? `/api/chats/${currentChatId}` : '/api/chats';
        const method = currentChatId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                preview: preview,
                full_content: fullContent,
                character : currentCharacter
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentChatId = data.id;
        alert(currentChatId ? "Chat updated successfully!" : "Chat saved successfully!");

        fetchSavedChats();
        console.log('Chat saved with ID:', data.id);
    } catch (error) {
        console.error('Error saving chat:', error);
        alert("Failed to save chat. Please make sure you are logged in.");
    }
}

function clearChat() {

    try {
        currentChat = [];
        document.getElementById('chat-history').innerHTML = '';
        //currentCharacter = null;
    } catch (error) {
        console.error('Error clearing chat:', error);
    }
    
    // Clear any other UI elements that display the chat
}

function startNewChat() {
    if (currentChat.length > 0) {
        if (!confirm("Are you sure you want to start a new chat? Any unsaved changes will be lost.")) {
            return;
        }
    }
    try {
        // Clear chat history
        document.getElementById('chat-history').innerHTML = '';
        
        // Reset chat-specific variables
        currentChat = [];
        currentChatId = null;
        currentCharacter = null;
        characterSelect.value = 'Dr. Watson'
        // Reset any other relevant UI elements (e.g., context, character selection)
        document.getElementById('context').value = '';
        
        // Generate a new system message
        const context = contextInput.value.trim();
        const character = characterSelect.value;
        let newSystemMessage = generateSystemMessage(context, character);
        currentChat.push({ role: "system", content: newSystemMessage });
        
        // Optionally, update UI to reflect new chat state
        updateUIForNewChat();
        
        console.log('Started a new chat session');
    } catch (error) {
        console.error('Error starting new chat:', error);
    }
}


function updateUIForNewChat() {
    // Update any UI elements to reflect a new chat state
    // For example, you might want to reset the character selection or context
    // Or change the appearance of the "New Chat" button
}




function generateSystemMessage(context, character) {
    let message = `You are Sherlock Holmes, the famous detective known for your proficiency in observation, deduction, forensic science, and logical reasoning that borders on the fantastic, which you employ when investigating cases for a wide variety of clients. Respond in character. Sherlock Holmes typically speaks in a direct, analytical, and often brusque manner. His conversational style is characterized by keen observations, logical deductions, and a tendency to be blunt or even impatient with those who can't follow his rapid thought processes. Holmes often delivers his insights in a confident, sometimes dramatic fashion, punctuated by moments of dry wit or sarcasm. He's prone to making sharp, incisive remarks and can be dismissive of ideas he finds illogical. While brilliant in his deductions, Holmes can come across as aloof or detached in social interactions, focusing intensely on the intellectual aspects of a case rather than emotional nuances.`;

    if (context) {
        message += ` Context: ${context}`;
    }

    message += ` You are currently in a conversation with `;

    const currentChar = customCharacters.find(char => char.name === character);
    if (currentChar) {
        message += `${currentChar.name}. ${currentChar.description} `;
        if (currentChar.relationship) message += `Their relationship to you is ${currentChar.relationship}. `;
        if (currentChar.traits && currentChar.traits.length > 0) message += `They have the following traits: ${currentChar.traits.join(', ')}. `;
        if (currentChar.speakingStyle) message += `Their speaking style: ${currentChar.speakingStyle}. `;
        if (currentChar.sherlockApproach) message += `Your approach to them: ${currentChar.sherlockApproach}. `;
        message += `Adjust your tone and manner of speaking accordingly.`;
    } else {
        message += `an unknown individual. Treat them as a stranger who has come to seek your help. This individual is unfamiliar with your methods and reputation, and may be skeptical or in awe of your abilities. Treat them with your typical blend of keen observation and deductive reasoning, while potentially showcasing your impatience with those who cannot follow your rapid thought processes.`;
    }

    return message;
}
document.getElementById('save-chat-btn').addEventListener('click', saveCurrentChat);
document.getElementById('start-new-chat-btn').addEventListener('click', startNewChat);

// Function to create a saved chat item
function createSavedChatItem(chat) {
    const chatItem = document.createElement('div');
    chatItem.className = 'saved-chat-item bg-white p-4 rounded-lg shadow-md mb-4 relative';
    chatItem.dataset.chatId = chat.id;
  
    const title = document.createElement('div');
    title.className = 'saved-chat-title';
    title.textContent = chat.title;
  
    const preview = document.createElement('div');
    preview.className = 'saved-chat-preview';
    preview.textContent = chat.preview;
  
    const timestamp = document.createElement('div');
    timestamp.className = 'saved-chat-timestamp';
    timestamp.textContent = new Date(chat.created_at).toLocaleString();
  
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-chat absolute top-2 right-2 text-red-500 hover:text-red-700';
    deleteButton.innerHTML = '&times;';
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteConfirmation(chat.id);
    });
  
    chatItem.appendChild(title);
    chatItem.appendChild(preview);
    chatItem.appendChild(timestamp);
    chatItem.appendChild(deleteButton);
  
    chatItem.addEventListener('click', () => loadChat(chat.id));
    
  
    return chatItem;
  }
  
  // Function to show delete confirmation
  function showDeleteConfirmation(chatId) {
    const chatItem = document.querySelector(`.saved-chat-item[data-chat-id="${chatId}"]`);
    const confirmation = document.createElement('div');
    confirmation.className = 'delete-confirmation';
    confirmation.innerHTML = `
      <p>Are you sure you want to delete this chat?</p>
      <div>
        <button class="confirm">Yes</button>
        <button class="cancel">No</button>
      </div>
    `;
  
    confirmation.querySelector('.confirm').addEventListener('click', () => deleteChat(chatId));
    confirmation.querySelector('.cancel').addEventListener('click', () => chatItem.removeChild(confirmation));
  
    chatItem.appendChild(confirmation);
  }

  async function fetchSavedChats() {
    try {
        console.log('Fetching saved chats...');
        const response = await fetch('/api/chats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const chats = await response.json();
        console.log('Received chats:', chats);
        updateSavedChatsList(chats);
    } catch (error) {
        console.error('Error fetching saved chats:', error);
    }
}
fetchSavedChats();


  
  // Function to delete a chat
// Function to show delete confirmation
function showDeleteConfirmation(chatId) {
    const overlay = document.createElement('div');
    overlay.className = 'delete-confirmation-overlay';
    document.body.appendChild(overlay);

    const confirmation = document.createElement('div');
    confirmation.className = 'delete-confirmation';
    confirmation.innerHTML = `
        <p>Are you sure you want to delete this chat?</p>
        <button class="confirm">Yes</button>
        <button class="cancel">No</button>
    `;

    overlay.appendChild(confirmation); // Add confirmation to overlay

    confirmation.querySelector('.confirm').addEventListener('click', () => {
        deleteChat(chatId);
        document.body.removeChild(overlay);
    });

    confirmation.querySelector('.cancel').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
}

  
// Function to load a chat
async function loadChat(chatId) {
    try {
        const response = await fetch(`/api/chats/${chatId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        clearChat();

        // Log the entire response to check for character field
        console.log('API response:', response);

        const chat = await response.json();
        
        console.log('Loaded chat data:', chat);  // Log the loaded chat data

        // Log the character
        console.log('Chat character:', chat.character);
        

        // Set the character
        currentCharacter = chat.character || 'Dr. Watson'; // Default to Dr. Watson if no character is set
        console.log('Setting currentCharacter to:', currentCharacter);

        // Update character select dropdown
        if (characterSelect.querySelector(`option[value="${currentCharacter}"]`)) {
            characterSelect.value = currentCharacter;
            console.log('Set characterSelect.value to:', characterSelect.value);
        } else {
            console.warn(`Character ${currentCharacter} not found in dropdown, defaulting to Dr. Watson`);
            characterSelect.value = 'Dr. Watson';
            currentCharacter = 'Dr. Watson';
        }

        // Parse the full_content and set currentChat
        currentChat = JSON.parse(chat.full_content);
        
        // Display messages
        currentChat.forEach(message => {
            if (message.role !== 'system') {
                addMessageToChat(message.role, message.content);
            }
        });
        
        currentChatId = chatId;
        isNewChat = false;
        
        console.log('Loaded chat with character:', currentCharacter);
        console.log('Final characterSelect.value:', characterSelect.value);
    } catch (error) {
        console.error('Error loading chat:', error);
        alert('Failed to load chat. Please try again.');
    }
}
  
// Modify the updateSavedChatsList function
function updateSavedChatsList(chats) {
    const savedChatsList = document.getElementById('saved-chats-list');
    console.log('Updating saved chats list with:', chats);
    savedChatsList.innerHTML = '';
    chats.forEach(chat => {0
        const chatItem = createSavedChatItem(chat);
        console.log('Created chat item:', chatItem);
        savedChatsList.appendChild(chatItem);
    });
}

function handleCharacterSwitch() {
    const newCharacter = characterSelect.value;
    if (currentChat.length > 0) {
        if (confirm("Switching characters will clear the current chat. Are you sure you want to continue? Unsaved changes will be lost.")) {
            clearChat();
            const context = contextInput.value.trim();
            const newSystemMessage = generateSystemMessage(context, newCharacter);
            currentChat = [{ role: "system", content: newSystemMessage }];
            currentCharacter = newCharacter;
        } else {
            // Revert the character selection
            characterSelect.value = currentCharacter;
        }
    } else {
        const context = contextInput.value.trim();
        const newSystemMessage = generateSystemMessage(context, newCharacter);
        currentChat = [{ role: "system", content: newSystemMessage }];
        currentCharacter = newCharacter;
    }
}

characterSelect.addEventListener('change', handleCharacterSwitch);













// Call fetchSavedChats when the page loads
document.addEventListener('DOMContentLoaded', fetchSavedChats);


document.getElementById('save-api-key-btn').addEventListener('click', function() {
    const apiKey = document.getElementById('api-key').value;
    localStorage.setItem('APIKey', apiKey); // Saves API key to local storage
    alert('API Key saved successfully!');
    console.log('Saved API Key:', apiKey);
});

document.getElementById('clear-api-key-btn').addEventListener('click', function() {
    localStorage.removeItem('APIKey'); // Removes the API key from local storage
    alert('API Key cleared successfully!');
    console.log('Cleared API Key');
});

function getApiKey() {
    const apiKey = localStorage.getItem('APIKey');
    return apiKey;
}


document.getElementById('save-model-btn').addEventListener('click', function() {
    const model = document.getElementById('model-select').value;
    localStorage.setItem('SelectedModel', model); // Saves selected model to local storage
    alert('Model saved successfully!');
    console.log('Saved Model:', model);
});
function getSelectedModel() {
    const model = localStorage.getItem('SelectedModel') || 'meta-llama/llama-3.1-8b-instruct:free'; // Default model
    console.log('Retrieved Model:', model);
    return model;
}

function updateLocalModelStatus(status, message = '') {
    const statusElement = document.getElementById('local-model-status');
    const loadingElement = document.getElementById('local-model-loading');
    const errorElement = document.getElementById('local-model-error');
    const loadButton = document.getElementById('load-local-model-btn');
    const unloadButton = document.getElementById('unload-local-model-btn');

    // Hide all messages initially
    loadingElement.classList.add('hidden');
    errorElement.classList.add('hidden');

    switch(status) {
        case 'not_loaded':
            statusElement.textContent = 'Not Loaded';
            loadButton.textContent = 'Load Model';
            loadButton.disabled = false;
            loadButton.classList.remove('hidden');
            unloadButton.classList.add('hidden');
            break;
        case 'loading':
            statusElement.textContent = 'Loading...';
            loadingElement.classList.remove('hidden');
            loadingElement.textContent = 'Model is loading. This may take a few minutes...';
            loadButton.disabled = true;
            unloadButton.classList.add('hidden');
            break;
        case 'ready':
            statusElement.textContent = 'Ready';
            loadButton.classList.add('hidden');
            unloadButton.classList.remove('hidden');
            unloadButton.disabled = false;
            break;
        case 'failed':
            statusElement.textContent = 'Failed to Load';
            errorElement.classList.remove('hidden');
            errorElement.textContent = message || 'An error occurred while loading the model.';
            loadButton.disabled = false;
            loadButton.classList.remove('hidden');
            unloadButton.classList.add('hidden');
            break;
    }
}

function unloadLocalModel() {
    fetch('/unload_local_model', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Model unloaded successfully") {
                updateLocalModelStatus('not_loaded');
            } else {
                updateLocalModelStatus('failed', data.message);
            }
        })
        .catch(error => {
            console.error('Error unloading model:', error);
            updateLocalModelStatus('failed', 'Failed to unload model');
        });
}


  // Add event listeners for model source radio buttons
const modelSourceRadios = document.querySelectorAll('input[name="model-source"]');
modelSourceRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentModelSource = e.target.value;
        updateUIForModelSource();
        checkAndLoadLocalModel();
        // If switching to local model, check if it needs to be loaded
        if (currentModelSource === 'local') {
            loadLocalModel()
        }
    });
});



// Modify the updateUIForModelSource function
function updateUIForModelSource() {
    const openRouterOptions = document.getElementById('openrouter-options');
    const localModelOptions = document.getElementById('local-model-options');
    const openRouterLabel = document.querySelector('label[for="openrouter"]');
    const localLabel = document.querySelector('label[for="local"]');

    if (currentModelSource === 'openrouter') {
        openRouterOptions.classList.remove('hidden');
        localModelOptions.classList.add('hidden');
        openRouterLabel.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
        localLabel.classList.remove('border-blue-600', 'text-blue-600', 'bg-blue-50');
    } else {
        openRouterOptions.classList.add('hidden');
        localModelOptions.classList.remove('hidden');
        openRouterLabel.classList.remove('border-blue-600', 'text-blue-600', 'bg-blue-50');
        localLabel.classList.add('border-blue-600', 'text-blue-600', 'bg-blue-50');
    }
    checkInitialModelStatus();
}

// Initial UI update
updateUIForModelSource();

// Modify the loadLocalModel function
function loadLocalModel() {
    updateLocalModelStatus('loading');
    fetch('/load_local_model', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Model loading started") {
                checkLocalModelStatus();
            } else if (data.message.includes("Model is already")) {
                updateLocalModelStatus('ready');
            } else {
                updateLocalModelStatus('failed', data.message);
            }
        })
        .catch(error => {
            console.error('Error starting model load:', error);
            updateLocalModelStatus('failed', 'Failed to start model loading');
        });
}



const toggleApiWindowBtn = document.getElementById('toggle-api-window');
    const apiMessageContainer = document.getElementById('api-message-container');

    console.log('Toggle button:', toggleApiWindowBtn); // Debugging line
    console.log('API message container:', apiMessageContainer); // Debugging line

    if (toggleApiWindowBtn && apiMessageContainer) {
        // Set initial state
        apiMessageContainer.style.display = 'block';

        toggleApiWindowBtn.addEventListener('click', function() {
            console.log('Toggle button clicked');  // Debugging line
            if (apiMessageContainer.style.display === 'none') {
                apiMessageContainer.style.display = 'block';
                console.log('API window shown');  // Debugging line
            } else {
                apiMessageContainer.style.display = 'none';
                console.log('API window hidden');  // Debugging line
            }
        });
    } else {
        console.error('Toggle button or API message container not found');
        if (!toggleApiWindowBtn) console.error('Toggle button not found');
        if (!apiMessageContainer) console.error('API message container not found');
    }

// Modify the checkLocalModelStatus function
function checkLocalModelStatus() {
    fetch('/check_model_status')
        .then(response => response.json())
        .then(data => {
            updateLocalModelStatus(data.status);
            if (data.status === 'loading') {
                setTimeout(checkLocalModelStatus, 5000); // Check every 5 seconds
            }
        })
        .catch(error => {
            console.error('Error checking model status:', error);
            updateLocalModelStatus('failed', 'Failed to check model status');
        });
}

// Add this function to handle local model loading
function checkAndLoadLocalModel() {
    const statusElement = document.getElementById('local-model-status');
    if (statusElement.textContent === 'Not Loaded') {
        // You can add logic here to start loading the local model
        // For now, we'll just update the UI
        updateLocalModelStatus('loading');
        // Simulating a load time of 3 seconds
        setTimeout(() => {
            updateLocalModelStatus('ready');
        }, 3000);
    }
}

function checkInitialModelStatus() {
    fetch('/check_model_status')
        .then(response => response.json())
        .then(data => {
            updateLocalModelStatus(data.status);
        })
        .catch(error => {
            console.error('Error checking initial model status:', error);
            updateLocalModelStatus('failed', 'Failed to check initial model status');
        });
}


});






