## WebApp Setup Guide

### **Prerequisites**
Ensure you have **Python 3.10.0** installed. This web application was designed to work specifically with this version.

---

### **Setup Instructions**

#### 1. **Install Dependencies**
Run the following command in the terminal from the root directory:
```bash
pip install -r requirements.txt
```

---

#### 2. **Database Setup (First-Time Only)**
Initialize the database by running:
```bash
python init_dt.py
```

---

#### 3. **Launch the Server**
To start the web server, execute:
```bash
python app.py
```

---

#### 4. **Access the WebApp**
Once the server is running, open your browser and navigate to:
```
http://127.0.0.1:5000/
```

---

### **Using OpenRouter Models**

#### API Key
To use OpenRouter models, you need an API key. You can try using the sample key below:

**Key**: `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`

- If the key is expired, create a free OpenRouter account and generate a new key from:  
  [https://openrouter.ai/settings/keys](https://openrouter.ai/settings/keys)

After obtaining the key, paste it into the application and press **Save Key**.

---

### **Using the Fine-Tuned Model**

#### Download the Model
To use the fine-tuned model `V5Sherlock8bit.gguf`, download it from the following link and place it in the root directory of the project:

[**Download Model**](https://drive.google.com/drive/folders/1SrBH66qNq7k65IUJy6nAFWot1w67B_lw?usp=sharing)

> **Note**: The model file is 8GB and cannot be uploaded to Moodle.

---

#### Alternative: Generate Fine-Tuned Model
You can generate the same fine-tuned model by running the `MainModelDevelopmentNoteBook.ipynb`. However, this process may take several hours depending on your system’s performance.

--- 

### **Summary**
1. Install dependencies.
2. Set up the database.
3. Launch the server.
4. Access the app via `http://127.0.0.1:5000/`.
5. Configure OpenRouter API key.
6. Download and place the fine-tuned model in the root directory, or generate it using the provided notebook.

---