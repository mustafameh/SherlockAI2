from openai import OpenAI
import logging

class ModelManager:
    def __init__(self, runpod_api_url, runpod_api_key):
        self.runpod_api_url = runpod_api_url
        self.runpod_api_key = runpod_api_key
        self.status = 'ready'  # Assume ready since the hosted model is always accessible

    def get_status(self):
        # Runpod-hosted model is always ready unless a network issue occurs
        return {'status': self.status}

    def inference(self, messages, temperature, max_tokens):
        
        client = OpenAI(api_key=self.runpod_api_key, base_url=self.runpod_api_url)
        
        
        if self.status != 'ready':
            raise Exception("Model is not ready")
        
        prompt = self.format_prompt(messages)  # Use same prompt formatting
        
        logging.info(f"Formatted prompt: {prompt}")


        try:
            response = client.completions.create(
                model="Robo8998/4bitQuantGPTQ",  # Replace with your actual model name
                prompt=prompt,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            print("Completion result:", response.choices[0].text)
    
            return response.choices[0].text
        except Exception as e:
            self.status = 'failed'
            raise Exception(f"Runpod inference failed: {e}")
        
        

    def format_prompt(self, messages):
        # Keep the prompt formatting logic as-is if Runpod accepts it
        formatted_prompt = ""
        for message in messages:
            role = message['role']
            content = message['content']
            formatted_prompt += f"<|start_header_id|>{role}<|end_header_id|>\n{content}<|eot_id|>"
        
        # Add assistant header to signal response generation
        formatted_prompt += "<|start_header_id|>assistant<|end_header_id|>"
        
        return formatted_prompt


    