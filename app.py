from openai import OpenAI

# Put your API key here
API_KEY = "YOUR_OPENAI_API_KEY"

client = OpenAI(api_key=API_KEY)


def build_prompt(language, feature, code):

    prompt = f"""
You are an expert senior software engineer and code reviewer.

Programming Language: {language}

Task: {feature}

Analyze the code and provide the following sections:

1. Code Summary
Explain what the code does.

2. Bugs or Errors
Identify syntax or logical issues.

3. Optimization Suggestions
Suggest better approaches.

4. Improved Code
Provide a corrected or optimized version.

5. Time Complexity
Explain time complexity.

Code:
{code}
"""

    return prompt


def analyze_code(language, feature, code):

    prompt = build_prompt(language, feature, code)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are an expert software engineer who reviews code professionally."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    result = response.choices[0].message.content

    return result