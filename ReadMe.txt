This webapp was designed to work with python version 3.10.0 please make sure you are using the correct version.
1. First please run and install all the dependencies by running pip install -r requirements.txt from the same directory.

2. For first time setup first run the database setup python file (python init_dt.py)
3. To launch the server please run (python app.py)
4. After the server is launched and running please open the browser and navigate to http://127.0.0.1:5000/ to interact with the webapp


5. To use Openrouter models you will neen an API key you can try to use/paste this key and PRESS SAVE KEY 
Key: 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
If the key is expired please create an openroute account for free and then create the a key from https://openrouter.ai/settings/keys

6. To use the fine tuned model. PLEASE DOWNLOAD THE FINETUNED MODEl named V5Sherlock8bit.gguf I have uploaded it to google drive since moodle does not allow uploading a file sized 8gb.
after downloading V5Sherlock8bit.gguf please place it in the root directory of the project. 
It can be downloaded from https://drive.google.com/drive/folders/1SrBH66qNq7k65IUJy6nAFWot1w67B_lw?usp=sharing

Alternatively you can produce the same Fine-tuned file by running the MainModelDevelopmentNoteBook.ipynb but as a disclaimer it will take a few hours depends on your system.

