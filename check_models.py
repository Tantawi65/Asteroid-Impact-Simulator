import google.generativeai as genai
import os

# Configure the API with your API key
genai.configure(api_key="AIzaSyACdyhiBbA1s7o0NipRxz_mvcndY-_UviY")

# List available models
for m in genai.list_models():
    print(m.name)