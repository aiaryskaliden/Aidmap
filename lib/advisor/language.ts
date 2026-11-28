import type { Language } from "./contracts";

export function answerLanguage(question: string, fallback: Language): Language {
  const q = question.toLowerCase();
  if (
    /\b(?:reply|answer|respond)\s+in\s+kazakh\b|жауапты қазақша|қазақша жауап|(?:ответь|отвечай)\s+(?:на казахском|по-казахски)/i.test(
      q,
    )
  )
    return "kk";
  if (
    /\b(?:reply|answer|respond)\s+in\s+english\b|ағылшынша жауап|(?:ответь|отвечай)\s+(?:на английском|по-английски)/i.test(
      q,
    )
  )
    return "en";
  if (
    /\b(?:reply|answer|respond)\s+in\s+russian\b|орысша жауап|(?:ответь|отвечай)\s+(?:на русском|по-русски)/i.test(
      q,
    )
  )
    return "ru";
  if (
    /[әғқңөұүһі]/iu.test(q) ||
    /(?:^|\s)(?:салем|калай|кандай|мерзим|болама|неше|айтшы|керек|ше)(?:\s|[?!.,]|$)/iu.test(
      q,
    )
  )
    return "kk";
  if (/\p{Script=Cyrillic}/u.test(q)) return "ru";
  if (
    /\b(?:how|what|when|which|where|hi|hello|thanks|compare|is|are|the|i|can|tell|would|find|my|about)\b/i.test(
      q,
    )
  )
    return "en";
  return fallback;
}
