// Gemini API Configuration
const API_KEY = "AIzaSyCkbFH8Ah9f5rSyOmZcjR1gSHkNNL7YLAA";

// --- Core Functions ---
async function callGeminiAPI(prompt, base64Image = null) {
  const model = "gemini-2.0-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  let parts = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: base64Image },
    });
  }

  const payload = { contents: [{ parts: parts }] };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API Error: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }

  const result = await response.json();
  if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
    return result.candidates[0].content.parts[0].text;
  } else {
    throw new Error("API response was empty or invalid.");
  }
}

async function getTextFromImage(base64ImageData) {
  const prompt = `សូមវិភាគរូបភាពនេះ៖

    បើរូបភាពនេះមាន៖
    - អក្សរខ្មែរ៖ ទាញយកអត្ថបទជាភាសាខ្មែរទាំងអស់
    - តន្ត្រី/ផ្ទាំងចម្រៀង៖ ទាញយកតែពាក្យចម្រៀងជាភាសាខ្មែរ (មិនរាប់បញ្ចូលកូដតន្ត្រី A, B, C, D, E, F, G ឬលេខផ្សេងៗ)
    - ទាំងតន្ត្រីទាំងអត្ថបទ៖ ទាញយកតែអត្ថបទភាសាខ្មែរ

    គោលការណ៍៖
    - រក្សាទម្រង់ចុះបន្ទាត់ដូចក្នុងរូបភាព
    - ទាញយកតែពាក្យ/អត្ថបទភាសាខ្មែរ
    - មិនរាប់បញ្ចូលកូដតន្ត្រី, លេខ, ឬសញ្ញាតន្ត្រីទេ
    - បើគ្មានអក្សរខ្មែរ ឆ្លើយ "រកមិនឃើញអក្សរខ្មែរ"`;

  return await callGeminiAPI(prompt, base64ImageData);
}

async function generatePPT(text) {
  const prompt = `អ្នកគឺជាអ្នកជំនាញក្នុងការរៀបចំ PowerPoint ចម្រៀងនិងបទគម្ពីរ។ សូមរៀបចំអត្ថបទខាងក្រោមនេះឲ្យក្លាយជាទម្រង់ PPT ដែលអាចប្រើបានភ្លាម។ 

    គោលការណ៍ណែនាំ៖
    - បំបែកអត្ថបទជាស្លាយតូចៗ (មួយស្លាយមួយខ្សែបទ ឬ២-៣ខ្សែ)
    - រៀបចំឲ្យងាយស្រួលអាន
    - ប្រើការដកឃ្លាពីរដងសម្រាប់បំបែកស្លាយ
    - រក្សាអត្ថន័យដើម
    - ធ្វើឲ្យសមរម្យសម្រាប់បង្ហាញក្នុងព្រះវិហារ
    - កុំបន្ថែមលេខស្លាយ (ស្លាយទី១, ស្លាយទី២) ទេ
    - ឆ្លើយតែអត្ថបទដែលបានរៀបចំប៉ុណ្ណោះ

    អត្ថបទដើម៖
    ---
    ${text}`;

  return await callGeminiAPI(prompt);
}

async function searchKhmerSong(query) {
  const prompt = `អ្នកគឺជាអ្នកជំនាញចម្រៀង គ្រីស្ទានខ្មែរ។ តើអ្នកអាចផ្ដល់ នៅ អត្ថបទចំរៀងបានទេ? សូមស្វែងរកនិងផ្តល់ខ្ញុំនូវចម្រៀង "${query}"។

  ទម្រង់ឆ្លើយ៖
  - ផ្តល់តែពាក្យចម្រៀងជាភាសាខ្មែរ
  - ប្រសិនបើអ្នកមិនស្គាល់ចម្រៀងពិតប្រាកដនោះទេ សូមផ្តល់ចម្រៀងស្រដៀងគ្នា និងផ្ដល់កាសំគាត់ថាអ្នករកបានតែចម្រងស្រដៀងប៉ុណ្ណោះ
  - កុំបន្ថែមកូដតន្ត្រី ឬការពន្យល់
  - រៀបចំឲ្យសមរម្យសម្រាប់ប្រើក្នុងព្រះវិហារ

  សំណើ៖ ${query}`;

  return await callGeminiAPI(prompt);
}

async function searchBibleVerse(query, version) {
  const prompt = `អ្នកគឺជាអ្នកជំនាញបទគម្ពីរ។ សូមស្វែងរកនិងផ្តល់ខ្ញុំនូវបទគម្ពីរ "${query}" ក្នុងកំណែ ${version}។

  ទម្រង់ឆ្លើយ៖
  - ផ្តល់ពាក្យបទគម្ពីរពេញលេញជាភាសាខ្មែរ
  - ប្រសិនបើមានច្រើនខុសគ្នា សូមផ្តល់តែមួយដែលពេញនិយម
  - កុំបន្ថែមការពន្យល់ឬបកស្រាយ
  - រៀបចំឲ្យសមរម្យសម្រាប់ប្រើក្នុងព្រះវិហារ

  សំណើ៖ ${query}
  កំណែ៖ បទគម្ពីរ ${version}`;

  return await callGeminiAPI(prompt);
}

// async function searchBibleVerse(query, version) {
//   // Enhanced prompt that better handles book names and verse ranges
//   const prompt = `អ្នកគឺជាជំនួយការ AI ជំនាញខាងព្រះគម្ពីរខ្មែរ។ សូមស្វែងរក និង​ផ្ដល់​បទគម្ពីរ "${query}" ក្នុង​កំណែ ${version}។

//   ការ​យល់​ដឹង​ពី​ទម្រង់​សំណើ៖
//   - ទម្រង់ "សៀវភៅ ជំពូក:ខ" (ឧ. យ៉ូហាន ៣:១៦) គឺ​សម្រាប់​ខ​តែមួយ។
//   - ទម្រង់ "សៀវភៅ ជំពូក:ខចាប់ផ្ដើម-ខបញ្ចប់" (ឧ. យ៉ូហាន ៣:១-១០) គឺ​สำหรับ​ខ​ច្រើន​ជាប់​គ្នា។
//   - ទម្រង់ "សៀវភៅ ជំពូក" (ឧ. ទំនុកតម្កើង ២៣) គឺ​สำหรับ​ជំពូក​ទាំងមូល។

//   ឈ្មោះ​សៀវភៅ​ដែល​ត្រូវ​ស្គាល់៖
//   - លោកុប្បត្តិ, និក្ខមនំ, លេវីវិន័យ, ជនគណនា, ចោទិយកថា, អេសាយ, យេរេមា, អេសេគាល, ដានីយ៉ែល
//   - ម៉ាថាយ, ម៉ាកុស, លូកា, យ៉ូហាន, កិច្ចការ, រ៉ូម, កូរិនថូស, កាឡាទី, អេភេសូរ
//   - ភីលីព, កូឡូស, ថែស្សាឡូនីច, ធីម៉ូថេ, ទីតុស, ហេព្រើរ, យ៉ាកុប, ពេត្រុស, យ៉ូហាន, យូដាស, វិវរណៈ
//   - ទំនុកតម្កើង, សុភាសិត, សាស្ដា, เพลงសរសើរ, អេសធើរ

//   ទម្រង់​នៃ​ការ​ឆ្លើយតប៖
//   - ផ្ដល់​เนื้อหา​បទគម្ពីរ​ពេញលេញ​ជា​ភាសាខ្មែរ។
//   - ចាប់ផ្ដើម​ដោយ​សេចក្ដី​យោង (ឈ្មោះ​សៀវភៅ ជំពូក:ខ)។
//   - ប្រសិនបើ​មាន​ខ​ច្រើន សូម​ដាក់​ខ​នីមួយៗ​នៅ​លើ​បន្ទាត់​ថ្មី។
//   - ប្រសិនបើ​ជំពូក​ទាំងមូល​វែង​ពេក អាច​សង្ខេប ឬ​ផ្ដល់​តែ​ខ​សំខាន់ៗ​បាន។
//   - ធ្វើ​ទ្រង់ទ្រាយ​ឲ្យ​បាន​សមរម្យ​សម្រាប់​ការ​បង្ហាញ​ក្នុង​កម្មវិធី​นมัสการ។
//   - មិន​ត្រូវ​បន្ថែម​ការ​ពន្យល់ ឬ​ការ​បកស្រាយ​ទេ។

//   សំណើ៖ ${query}
//   កំណែ​ព្រះគម្ពីរ៖ ${version}`;

//   return await callGeminiAPI(prompt);
// }

async function getSpellCheck(text) {
  const prompt = `អ្នកគឺជាអ្នកជំនាញភាសាខ្មែរ។ សូមពិនិត្យ និងកែតម្រូវអក្ខរាវិរុទ្ធ រួមទាំងដកឃ្លាផងដែរ នៅក្នុងអត្ថបទខាងក្រោមនេះ។ សំខាន់ណាស់៖ សូមរក្សាទម្រង់ដើមរបស់អត្ថបទ (ការចុះបន្ទាត់ និងការដកឃ្លាចន្លោះស្លាយ) ឲ្យបានពិតប្រាកដ។ ឆ្លើយតែអត្ថបទដែលបានកែរួចប៉ុណ្ណោះ។\n\nអត្ថបទសម្រាប់ពិនិត្យ៖\n---\n${text}`;
  return await callGeminiAPI(prompt);
}