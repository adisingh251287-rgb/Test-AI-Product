export interface PresetVoiceScenario {
  id: string;
  label: string;
  text: string;
  language: string;
  industry: 'real_estate' | 'solar' | 'visa';
  sentiment: 'happy' | 'neutral' | 'angry' | 'vip';
  speaker: string;
}

export const PRESET_SCENARIOS: PresetVoiceScenario[] = [
  {
    id: "scen-1",
    label: "Property Query (VIP Punjabi)",
    text: "Sat Sri Akal paaji, main NRI haan te Mohali Airport Road de aas-paas premium 3 BHK builder floors dekh reha haan self-use layi. Budget is not an issue, safe gated facing chahi di hai.",
    language: "Punjabi",
    industry: "real_estate",
    sentiment: "vip",
    speaker: "Gurpreet Singh (NRI Guest)"
  },
  {
    id: "scen-2",
    label: "Angry Site Visit Complaint (Escalation)",
    text: "Main dubaara call nahi karunga, main sidha social media pe complaint post daal raha hoon! Pichle Sunday hum dhoop me wait karte rahe aur aapke sales partner ne delay coordinate nahi kiya! Mera advance token refund karo!",
    language: "Hinglish",
    industry: "real_estate",
    sentiment: "angry",
    speaker: "Amolak Singh"
  },
  {
    id: "scen-3",
    label: "Solar Setup Price Request (Sales Lead)",
    text: "Mera monthly bil 12,000 ruffly aunda hai Ludhiana industrial area de kol. 5kW system lagwane de utte subsidy PM Surya Ghar de under kitni mil sakdi hai, te manual loan apply ho jayega?",
    language: "Punjabi/Hinglish",
    industry: "solar",
    sentiment: "neutral",
    speaker: "Sukhdev Jassal"
  },
  {
    id: "scen-4",
    label: "Billing Issue & Technical Glitch (Support)",
    text: "Sir humare flat par double swing solar dynamic meter validation control issue chal raha hai and bill high aa gaya. Kindly net-meter status check karvaiye, manual technician book karke direct report share kijiye.",
    language: "Hinglish",
    industry: "solar",
    sentiment: "angry",
    speaker: "Rahul Sharma (Ludhiana Retail)"
  },
  {
    id: "scen-5",
    label: "Canada Visa & IELTS bands check (Sales)",
    text: "Hi, I have overall 6.5 bands but 5.5 in writing section. Canada study visa SDS file review possible hai September intake layi, or is coaching required?",
    language: "English/Hinglish",
    industry: "visa",
    sentiment: "neutral",
    speaker: "Jaspreet Kaur"
  }
];
