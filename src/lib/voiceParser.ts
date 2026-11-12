export interface ParsedVoiceResult {
  type?: 'Expense' | 'Sale' | 'Yield';
  crop?: string;
  expenseCategory?: string;
  amount?: number;
  quantity?: number;
  price?: number;
  unit?: string;
  note?: string;
}

const CROP_SYNONYMS: Record<string, string> = {
  गेहूं: 'Wheat',
  गहू: 'Wheat',
  सोयाबीन: 'Soybean',
  चना: 'Gram',
  सरसों: 'Mustard',
  राई: 'Mustard',
  धान: 'Rice',
  चावल: 'Rice',
  कपास: 'Cotton',
  रुई: 'Cotton',
  मक्का: 'Maize',
  लहसुन: 'Garlic',
  मूंगफली: 'Groundnut',
  प्याज: 'Onion',
  कांदा: 'Onion',
  आलू: 'Potato',
  बटाटा: 'Potato',
  टमाटर: 'Tomato',
  गन्ना: 'Sugarcane',
  बाजरा: 'Bajra',
  ज्वार: 'Jowar',
  मटर: 'Peas',
  धनिया: 'Coriander',
  मिर्च: 'Chilli',
};

const EXPENSE_SYNONYMS: Record<string, string> = {
  बीज: 'बीज',
  सीड: 'बीज',
  खाद: 'खाद',
  यूरिया: 'खाद',
  डीएपी: 'खाद',
  पोटाश: 'खाद',
  फर्टिलाइजर: 'खाद',
  कीटनाशक: 'कीटनाशक',
  दवाई: 'कीटनाशक',
  कीट: 'कीटनाशक',
  स्प्रे: 'कीटनाशक',
  डीजल: 'डीजल/ट्रैक्टर',
  ट्रैक्टर: 'डीजल/ट्रैक्टर',
  जुताई: 'डीजल/ट्रैक्टर',
  हकाई: 'डीजल/ट्रैक्टर',
  मजदूरी: 'मजदूरी',
  लेबर: 'मजदूरी',
  निंदाई: 'मजदूरी',
  कटाई: 'मजदूरी',
  सिंचाई: 'सिंचाई',
  पानी: 'सिंचाई',
  बिजली: 'बिजली',
  ढुलाई: 'ढुलाई',
  भाड़ा: 'ढुलाई',
  किराया: 'ढुलाई',
  ईंट: 'अन्य खर्च',
  तारबंदी: 'अन्य खर्च',
};

// Convert Devanagari numerals to standard ASCII digits
function normalizeHindiNumerals(text: string): string {
  const hindiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  let res = text;
  for (let i = 0; i < 10; i++) {
    res = res.replace(new RegExp(hindiDigits[i], 'g'), String(i));
  }
  return res;
}

export function parseVoiceInput(transcript: string): ParsedVoiceResult {
  const rawText = normalizeHindiNumerals(transcript);
  const text = rawText.toLowerCase();
  const res: ParsedVoiceResult = {};

  // 1. Detect Type
  if (
    text.includes('बेचा') ||
    text.includes('बिक्री') ||
    text.includes('सेल') ||
    text.includes('मंडी') ||
    text.includes('बेची') ||
    text.includes('बिका')
  ) {
    res.type = 'Sale';
  } else if (
    text.includes('पैदावार') ||
    text.includes('उपज') ||
    text.includes('हार्वेस्ट') ||
    text.includes('निकली') ||
    text.includes('निकाला')
  ) {
    res.type = 'Yield';
  } else {
    res.type = 'Expense';
  }

  // 2. Detect Crop
  for (const [key, crop] of Object.entries(CROP_SYNONYMS)) {
    if (text.includes(key)) {
      res.crop = crop;
      break;
    }
  }

  // 3. Detect Expense Category
  for (const [key, cat] of Object.entries(EXPENSE_SYNONYMS)) {
    if (text.includes(key)) {
      res.expenseCategory = cat;
      break;
    }
  }

  // 4. Detect Explicit Unit
  if (text.includes('क्विंटल') || text.includes('कंटल') || text.includes('qtl')) {
    res.unit = 'Quintal';
  } else if (text.includes('किलो') || text.includes('केजी') || text.includes('kg')) {
    res.unit = 'Kg';
  } else if (text.includes('बोरी') || text.includes('कट्टा') || text.includes('कट्टे') || text.includes('बैग')) {
    res.unit = 'बोरी (Bags)';
  } else if (text.includes('घंटे') || text.includes('घंटा') || text.includes('hour')) {
    res.unit = 'घंटे (Hours)';
  } else if (text.includes('लीटर') || text.includes('लिटर') || text.includes('liter')) {
    res.unit = 'लीटर (Liter)';
  } else if (text.includes('ट्रॉली') || text.includes('ट्राली') || text.includes('trolley')) {
    res.unit = 'ट्रॉली (Trolley)';
  } else if (text.includes('टन') || text.includes('ton')) {
    res.unit = 'Ton';
  } else if (text.includes('पैकेट') || text.includes('packet')) {
    res.unit = 'पैकेट (Packets)';
  } else if (text.includes('दिन') || text.includes('day')) {
    res.unit = 'दिन (Days)';
  }

  // 5. Contextual Number Parsing (Avoid naive min/max assumption)
  // Extract patterns for quantity, rate/price, and total amount based on adjacent keywords

  // Pattern A: Number attached to quantity unit/item (e.g. "50 किलो", "4 बोरी", "1200 ईंट", "10 घंटे")
  const qtyUnitMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:किलो|केजी|kg|क्विंटल|कंटल|qtl|बोरी|कट्टा|कट्टे|बैग|लीटर|लिटर|घंटे|घंटा|दिन|ट्रॉली|ट्राली|टन|पैकेट|ईंट|नग|पौधे|मजदूर)/
  );

  // Pattern B: Number attached to rate/price (e.g. "2400 भाव", "भाव 2400", "500 प्रति बोरी", "दर 2200")
  const priceMatch =
    text.match(/(\d+(?:\.\d+)?)\s*(?:भाव|दर|रेट|प्रति\s*(?:बोरी|किलो|क्विंटल|घंटे)?|के\s*भाव|की\s*दर)/) ||
    text.match(/(?:भाव|दर|रेट|प्रति)\s*[:=]?\s*(\d+(?:\.\d+)?)/);

  // Pattern C: Number attached to amount/currency (e.g. "1350 रुपये", "रुपये 1350", "रकम 2000", "खर्च 500")
  const amountMatch =
    text.match(/(\d+(?:\.\d+)?)\s*(?:रुपये|रुपया|रूपये|रू|रु|₹|rs|inr|पैसा)/) ||
    text.match(/(?:रुपये|रुपया|रू|रु|₹|rs|खर्च|लागत|रकम|भुगतान|दिए|मिले|कुल)\s*[:=]?\s*(\d+(?:\.\d+)?)/);

  let detectedQty: number | undefined = qtyUnitMatch ? parseFloat(qtyUnitMatch[1]) : undefined;
  let detectedPrice: number | undefined = priceMatch ? parseFloat(priceMatch[1]) : undefined;
  let detectedAmount: number | undefined = amountMatch ? parseFloat(amountMatch[1]) : undefined;

  // Extract all numeric tokens and their index positions
  const numMatches: { val: number; index: number; fullMatch: string }[] = [];
  const numRegex = /\d+(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = numRegex.exec(text)) !== null) {
    numMatches.push({ val: parseFloat(m[0]), index: m.index, fullMatch: m[0] });
  }

  if (numMatches.length === 1) {
    const singleNum = numMatches[0].val;
    if (detectedQty !== undefined) {
      res.quantity = detectedQty;
    } else if (detectedAmount !== undefined) {
      res.amount = detectedAmount;
    } else if (res.type === 'Yield') {
      res.quantity = singleNum;
    } else if (singleNum > 100) {
      res.amount = singleNum;
    } else {
      res.quantity = singleNum;
    }
  } else if (numMatches.length >= 2) {
    // If contextual patterns identified specific numbers:
    if (detectedQty !== undefined && detectedAmount !== undefined && detectedQty !== detectedAmount) {
      res.quantity = detectedQty;
      res.amount = detectedAmount;
    } else if (detectedQty !== undefined && detectedPrice !== undefined) {
      res.quantity = detectedQty;
      res.price = detectedPrice;
      res.amount = detectedAmount ?? Math.round(detectedQty * detectedPrice * 100) / 100;
    } else if (detectedAmount !== undefined) {
      // One number was specifically marked with currency/expense keywords
      res.amount = detectedAmount;
      // Assign the remaining number to quantity or price
      const remainingNum = numMatches.find((n) => Math.abs(n.val - detectedAmount!) > 0.001);
      if (remainingNum) {
        if (priceMatch) {
          res.price = remainingNum.val;
        } else {
          res.quantity = remainingNum.val;
        }
      }
    } else if (detectedQty !== undefined) {
      // One number was specifically marked with unit/item keywords (e.g. 1200 ईंट)
      res.quantity = detectedQty;
      const remainingNum = numMatches.find((n) => Math.abs(n.val - detectedQty!) > 0.001);
      if (remainingNum) {
        res.amount = remainingNum.val;
      }
    } else {
      // Neither number had explicit keyword markers:
      // In agricultural speech grammar: [Item] [Quantity] [Total/Amount]
      // E.g., "खाद 2 600", "डीजल 10 950" -> first number is count/quantity, second is total amount
      res.quantity = numMatches[0].val;
      res.amount = numMatches[1].val;
    }

    if (detectedPrice !== undefined && res.price === undefined) {
      res.price = detectedPrice;
    }
  }

  // If rate and quantity exist but no amount, calculate amount
  if (res.quantity && res.price && !res.amount) {
    res.amount = Math.round(res.quantity * res.price * 100) / 100;
  }

  res.note = transcript.trim();
  return res;
}
