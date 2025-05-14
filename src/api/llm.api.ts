import { Reminder } from "../models/reminder";

const axios = require('axios');
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
export async function generateCongratulation(reminder: Reminder) {

  const prompt = `Напиши поздравление с ${reminder.occasion} для ${reminder.congratName}. ${reminder.info? 'Поздравление должно быть:'+reminder.info:''}`

  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const generatedText = response.data.choices[0].message.content;
    const tokensUsed = response.data.usage.total_tokens;
    console.log('Использовано токенов:', tokensUsed);
    return generatedText;

  } catch (error) {
    console.error('Ошибка запроса к DeepSeek:', error.response?.data || error.message);
    return "Ошибка при генерации поздравления. Попробуйте позже.";
  }
}
