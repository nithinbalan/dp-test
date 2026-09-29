/**
 * The "Jethur AI drafts it" step — a deterministic template fill from a linked RoPA
 * activity or free text, exactly mirroring the prototype's `ntFromRopa`/`ntFromText`.
 * Pure content generation only: no DB, no workspace context. `service.ts` calls
 * these and owns everything about persisting the result.
 */
import { LAWFUL_BASIS_LABELS, type ProcessingActivity } from '@shared/mock/ropa';

export type StandardSectionKey =
  'who' | 'collect' | 'why' | 'how' | 'share' | 'keep' | 'rights' | 'contact';

export type OptionalSectionKey = 'security' | 'children' | 'transfer' | 'cookies' | 'changes';

export type NoticeSectionKey =
  StandardSectionKey | OptionalSectionKey | (string & Record<never, never>);

export type NoticeSection = {
  key: NoticeSectionKey;
  heading: string;
  body: string;
  alts?: string[];
  alt?: number;
};

export type NoticeLanguageInfo = {
  en: string;
  nat: string;
  rtl?: boolean;
};

export const NT_L8: readonly NoticeLanguageInfo[] = [
  { en: 'English', nat: 'English' },
  { en: 'Assamese', nat: 'অসমীয়া' },
  { en: 'Bengali', nat: 'বাংলা' },
  { en: 'Bodo', nat: 'बड़ो' },
  { en: 'Dogri', nat: 'डोगरी' },
  { en: 'Gujarati', nat: 'ગુજરાતી' },
  { en: 'Hindi', nat: 'हिन्दी' },
  { en: 'Kannada', nat: 'ಕನ್ನಡ' },
  { en: 'Kashmiri', nat: 'کٲشُر', rtl: true },
  { en: 'Konkani', nat: 'कोंकणी' },
  { en: 'Maithili', nat: 'मैथिली' },
  { en: 'Malayalam', nat: 'മലയാളം' },
  { en: 'Manipuri', nat: 'মৈতৈলোন্' },
  { en: 'Marathi', nat: 'मराठी' },
  { en: 'Nepali', nat: 'नेपाली' },
  { en: 'Odia', nat: 'ଓଡ଼ିଆ' },
  { en: 'Punjabi', nat: 'ਪੰਜਾਬੀ' },
  { en: 'Sanskrit', nat: 'संस्कृतम्' },
  { en: 'Santali', nat: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { en: 'Sindhi', nat: 'سنڌي', rtl: true },
  { en: 'Tamil', nat: 'தமிழ்' },
  { en: 'Telugu', nat: 'తెలుగు' },
  { en: 'Urdu', nat: 'اردو', rtl: true },
] as const;

export const STANDARD_SECTION_KEYS: readonly StandardSectionKey[] = [
  'who',
  'collect',
  'why',
  'how',
  'share',
  'keep',
  'rights',
  'contact',
] as const;

export const NT_H: Record<string, readonly string[]> = {
  English: [
    'Who We Are',
    'What Personal Data We Collect',
    'Why We Collect Your Personal Data',
    'How We Use Your Personal Data',
    'Who We Share Your Personal Data With',
    'How Long We Keep Your Personal Data',
    'Your Rights',
    'How to Contact Us',
  ],
  Hindi: [
    'हम कौन हैं',
    'हम कौन-सा व्यक्तिगत डेटा एकत्र करते हैं',
    'हम आपका व्यक्तिगत डेटा क्यों एकत्र करते हैं',
    'हम आपके डेटा का उपयोग कैसे करते हैं',
    'हम आपका डेटा किसके साथ साझा करते हैं',
    'हम आपका डेटा कितने समय तक रखते हैं',
    'आपके अधिकार',
    'हमसे कैसे संपर्क करें',
  ],
  Malayalam: [
    'ഞങ്ങൾ ആരാണ്',
    'ഞങ്ങൾ ശേഖരിക്കുന്ന വ്യക്തിഗത വിവരങ്ങൾ',
    'എന്തിനാണ് വിവരങ്ങൾ ശേഖരിക്കുന്നത്',
    'വിവരങ്ങൾ എങ്ങനെ ഉപയോഗിക്കുന്നു',
    'ആരുമായാണ് പങ്കിടുന്നത്',
    'എത്ര കാലം സൂക്ഷിക്കുന്നു',
    'നിങ്ങളുടെ അവകാശങ്ങൾ',
    'ഞങ്ങളെ എങ്ങനെ ബന്ധപ്പെടാം',
  ],
  Tamil: [
    'நாங்கள் யார்',
    'நாங்கள் சேகரிக்கும் தனிப்பட்ட தரவு',
    'ஏன் சேகரிக்கிறோம்',
    'உங்கள் தரவை எப்படி பயன்படுத்துகிறோம்',
    'யாருடன் பகிர்கிறோம்',
    'எவ்வளவு காலம் வைத்திருக்கிறோம்',
    'உங்கள் உரிமைகள்',
    'எங்களை எப்படி தொடர்புகொள்வது',
  ],
  Bengali: [
    'আমরা কারা',
    'আমরা কোন ব্যক্তিগত তথ্য সংগ্রহ করি',
    'কেন আমরা আপনার তথ্য সংগ্রহ করি',
    'আমরা আপনার তথ্য কীভাবে ব্যবহার করি',
    'আমরা কার সঙ্গে আপনার তথ্য ভাগ করি',
    'আমরা কত দিন আপনার তথ্য রাখি',
    'আপনার অধিকার',
    'আমাদের সঙ্গে কীভাবে যোগাযোগ করবেন',
  ],
  Gujarati: [
    'અમે કોણ છીએ',
    'અમે કઈ વ્યક્તિગત માહિતી એકત્ર કરીએ છીએ',
    'અમે તમારી માહિતી કેમ એકત્ર કરીએ છીએ',
    'અમે તમારી માહિતીનો ઉપયોગ કેવી રીતે કરીએ છીએ',
    'અમે તમારી માહિતી કોની સાથે વહેંચીએ છીએ',
    'અમે તમારી માહિતી કેટલો સમય રાખીએ છીએ',
    'તમારા અધિકારો',
    'અમારો સંપર્ક કેવી રીતે કરવો',
  ],
  Kannada: [
    'ನಾವು ಯಾರು',
    'ನಾವು ಯಾವ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿ ಸಂಗ್ರಹಿಸುತ್ತೇವೆ',
    'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಏಕೆ ಸಂಗ್ರಹಿಸುತ್ತೇವೆ',
    'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಹೇಗೆ ಬಳಸುತ್ತೇವೆ',
    'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಯಾರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳುತ್ತೇವೆ',
    'ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಎಷ್ಟು ಕಾಲ ಇಡುತ್ತೇವೆ',
    'ನಿಮ್ಮ ಹಕ್ಕುಗಳು',
    'ನಮ್ಮನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸುವುದು',
  ],
  Marathi: [
    'आम्ही कोण आहोत',
    'आम्ही कोणती वैयक्तिक माहिती गोळा करतो',
    'आम्ही तुमची माहिती का गोळा करतो',
    'आम्ही तुमची माहिती कशी वापरतो',
    'आम्ही तुमची माहिती कोणासोबत सामायिक करतो',
    'आम्ही तुमची माहिती किती काळ ठेवतो',
    'तुमचे अधिकार',
    'आमच्याशी संपर्क कसा साधावा',
  ],
  Odia: [
    'ଆମେ କିଏ',
    'ଆମେ କେଉଁ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ସଂଗ୍ରହ କରୁ',
    'ଆମେ ଆପଣଙ୍କ ତଥ୍ୟ କାହିଁକି ସଂଗ୍ରହ କରୁ',
    'ଆମେ ଆପଣଙ୍କ ତଥ୍ୟ କିପରି ବ୍ୟବହାର କରୁ',
    'ଆମେ ଆପଣଙ୍କ ତଥ୍ୟ କାହା ସହିତ ଅଂଶୀଦାର କରୁ',
    'ଆମେ ଆପଣଙ୍କ ତଥ୍ୟ କେତେ ଦିନ ରଖୁ',
    'ଆପଣଙ୍କ ଅଧିକାର',
    'ଆମ ସହିତ କିପରି ଯୋଗାଯୋଗ କରିବେ',
  ],
  Punjabi: [
    'ਅਸੀਂ ਕੌਣ ਹਾਂ',
    'ਅਸੀਂ ਕਿਹੜਾ ਨਿੱਜੀ ਡਾਟਾ ਇਕੱਠਾ ਕਰਦੇ ਹਾਂ',
    'ਅਸੀਂ ਤੁਹਾਡਾ ਡਾਟਾ ਕਿਉਂ ਇਕੱਠਾ ਕਰਦੇ ਹਾਂ',
    'ਅਸੀਂ ਤੁਹਾਡਾ ਡਾਟਾ ਕਿਵੇਂ ਵਰਤਦੇ ਹਾਂ',
    'ਅਸੀਂ ਤੁਹਾਡਾ ਡਾਟਾ ਕਿਸ ਨਾਲ ਸਾਂਝਾ ਕਰਦੇ ਹਾਂ',
    'ਅਸੀਂ ਤੁਹਾਡਾ ਡਾਟਾ ਕਿੰਨਾ ਸਮਾਂ ਰੱਖਦੇ ਹਾਂ',
    'ਤੁਹਾਡੇ ਹੱਕ',
    'ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਿਵੇਂ ਕਰਨਾ ਹੈ',
  ],
  Telugu: [
    'మేము ఎవరు',
    'మేము ఏ వ్యక్తిగత సమాచారం సేకరిస్తాము',
    'మీ సమాచారాన్ని ఎందుకు సేకరిస్తాము',
    'మీ సమాచారాన్ని ఎలా ఉపయోగిస్తాము',
    'మీ సమాచారాన్ని ఎవరితో పంచుకుంటాము',
    'మీ సమాచారాన్ని ఎంతకాలం ఉంచుతాము',
    'మీ హక్కులు',
    'మమ్మల్ని ఎలా సంప్రదించాలి',
  ],
  Urdu: [
    'ہم کون ہیں',
    'ہم کون سا ذاتی ڈیٹا جمع کرتے ہیں',
    'ہم آپ کا ڈیٹا کیوں جمع کرتے ہیں',
    'ہم آپ کا ڈیٹا کیسے استعمال کرتے ہیں',
    'ہم آپ کا ڈیٹا کس کے ساتھ شیئر کرتے ہیں',
    'ہم آپ کا ڈیٹا کتنے عرصے تک رکھتے ہیں',
    'آپ کے حقوق',
    'ہم سے کیسے رابطہ کریں',
  ],
  Assamese: [
    'আমি কোন',
    'আমি কি ব্যক্তিগত তথ্য সংগ্ৰহ কৰোঁ',
    'আমি আপোনাৰ তথ্য কিয় সংগ্ৰহ কৰোঁ',
    'আমি আপোনাৰ তথ্য কেনেকৈ ব্যৱহাৰ কৰোঁ',
    'আমি আপোনাৰ তথ্য কাৰ সৈতে ভাগ কৰোঁ',
    'আমি আপোনাৰ তথ্য কিমান দিন ৰাখোঁ',
    'আপোনাৰ অধিকাৰ',
    'আমাৰ সৈতে কেনেকৈ যোগাযোগ কৰিব',
  ],
};

export type OptionalSectionDefinition = {
  key: OptionalSectionKey;
  heading: string;
  note: string;
  body: string;
};

export const NT_EXTRA: readonly OptionalSectionDefinition[] = [
  {
    key: 'security',
    heading: 'How We Keep Your Personal Data Safe',
    note: 's.8(5) safeguards',
    body:
      'We protect your personal data with reasonable security safeguards, as section 8(5) of the DPDP Act requires:\n' +
      '• Access is limited to the staff whose job needs it, and every access is logged.\n' +
      '• Data is encrypted in transit and at rest.\n' +
      '• We review who has access every quarter, and remove it the day someone leaves.\n\n' +
      'If a breach ever happens, we tell the Data Protection Board and every affected person, as section 8(6) requires.',
  },
  {
    key: 'children',
    heading: 'Children and Persons with a Guardian',
    note: 's.9 · verifiable parental consent',
    body:
      'Where you are under 18, or where a guardian acts for you, we process personal data only with verifiable consent from your parent or lawful guardian (section 9).\n\n' +
      'We do not track you, build a profile of you, or show you targeted advertising.',
  },
  {
    key: 'transfer',
    heading: 'Where Your Personal Data Is Stored',
    note: 's.16 · transfer outside India',
    body:
      'Your personal data is stored in India — [[name the region and provider]].\n\n' +
      'If we ever transfer it outside India, we do so only to countries the Central Government has not restricted under section 16, and the recipient stays bound by the same protections.',
  },
  {
    key: 'cookies',
    heading: 'Cookies and Similar Technologies',
    note: 'consent for non-essential cookies',
    body:
      'Our website uses cookies and similar technologies to keep you signed in, remember your preferences and understand how the site is used.\n\n' +
      'You can accept or refuse non-essential cookies from the banner on your first visit, and change your mind at any time from the cookie settings link in the footer.',
  },
  {
    key: 'changes',
    heading: 'Changes to This Notice',
    note: 'versioning · re-consent',
    body:
      'If we change this notice, we publish the new version at this address and update the version number and date at the top.\n\n' +
      'Where a change affects why or how we use your personal data, we tell you before it takes effect — and ask for your consent again where the law requires it.',
  },
] as const;

export const NT_ORG = 'Your Company Pvt Ltd';
export const NT_DPO = 'dpo@yourco.jethurdpdp.com';
export const NT_GRV = 'grievance@yourco.jethurdpdp.com';

export const NT_FILL: Record<string, string> = {
  '[[Company name]]': NT_ORG,
  '[[registered office address]]':
    '2nd Floor, Technopark Phase I, Thiruvananthapuram 695581, Kerala',
  '[[Grievance Officer name]]': `Muntasir Mansoor, Grievance Officer (${NT_GRV})`,
  '[[response period]]': '30 days',
};

export const NT_SIMPLE: readonly [RegExp, string][] = [
  [/utilis(e|ing)/gi, 'use'],
  [/commence/gi, 'start'],
  [/pursuant to/gi, 'under'],
  [/in accordance with/gi, 'under'],
  [/shall be/gi, 'is'],
  [/prior to/gi, 'before'],
  [/subsequent to/gi, 'after'],
  [/with respect to/gi, 'about'],
  [/in the event that/gi, 'if'],
  [/for the purpose of/gi, 'to'],
  [/Data Fiduciary \(that is us\) \(that is us\)/g, 'Data Fiduciary (that is us)'],
];

export const NT_IMPROVE: Record<string, string> = {
  who: `\n\nRegistered office: [[registered office address]].\nData Protection Officer: ${NT_DPO}.`,
  collect:
    '\n\nWe ask only for what this purpose needs. If you leave something out, we will tell you what it affects.',
  why: '\n\nBecause we rely on your consent, you can withdraw it at any time — and withdrawing is as easy as giving it was.',
  how: '\n\nWe do not use your personal data to make automated decisions about you.',
  share:
    '\n\nEach recipient works under a written contract under section 8(2) of the DPDP Act. We do not sell your personal data.',
  keep: '\n\nWhen the purpose is served, or when you withdraw consent, we erase it — unless a law requires us to keep it longer.',
  rights: '\n\nWe do not charge a fee for rights requests.',
  contact: `\n\nGrievance Officer: [[Grievance Officer name]]\nWe respond to grievances within [[response period]].`,
};

export function getRightsBody(): string {
  return (
    'Under the Digital Personal Data Protection Act, 2023 you can:\n' +
    '• Ask us for a summary of the personal data we hold about you, and who we have shared it with (section 11).\n' +
    '• Ask us to correct, complete, update or erase your personal data (section 12).\n' +
    '• Raise a grievance with us — and you must come to us first, before the Data Protection Board (section 13).\n' +
    '• Nominate someone to exercise these rights for you if you die or cannot act for yourself (section 14).\n' +
    '• Withdraw your consent at any time, as easily as you gave it (section 6(4)).\n\n' +
    'Use the request form at yourco.jethurdpdp.com/privacy/requests, or write to us at the address below. We do not charge for this.'
  );
}

export function getContactBody(): string {
  return (
    `For anything about this notice or your personal data, contact our Data Protection Officer at ${NT_DPO}.\n\n` +
    'Grievance Officer: [[Grievance Officer name]]\nWe respond to grievances within [[response period]].\n\n' +
    'If you are not satisfied with our response, you may complain to the Data Protection Board of India.'
  );
}

export function ntEsc(t: string): string {
  return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function ntIsHtml(t: string): boolean {
  return /<(p|div|ul|ol|li|br|b|i|u|a|strong|em)\b[^>]*>/i.test(t || '');
}

export function ntTxt2Html(t: string): string {
  const clean = (t || '').replace(/\r/g, '');
  if (ntIsHtml(clean)) return clean;
  if (!clean.trim()) return '<p><br></p>';
  return clean
    .split(/\n{2,}/)
    .map((blk) => {
      let out = '';
      let li: string[] = [];
      function flush() {
        if (li.length) {
          out += '<ul>' + li.map((x) => '<li>' + ntEsc(x) + '</li>').join('') + '</ul>';
          li = [];
        }
      }
      let para: string[] = [];
      function flushP() {
        if (para.length) {
          out += '<p>' + para.map(ntEsc).join('<br>') + '</p>';
          para = [];
        }
      }
      blk.split('\n').forEach((l) => {
        if (/^\s*[\u2022-]\s+/.test(l)) {
          flushP();
          li.push(l.replace(/^\s*[\u2022-]\s+/, ''));
        } else {
          flush();
          if (l.trim()) para.push(l);
        }
      });
      flushP();
      flush();
      return out;
    })
    .join('');
}

export function ntHtml2Txt(h: string): string {
  const t = (h || '')
    .replace(/<li[^>]*>/gi, '\n•  ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return t
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ntTpl(k: StandardSectionKey): string {
  const T: Record<StandardSectionKey, string> = {
    who: `${NT_ORG} is the Data Fiduciary for the personal data described in this notice — we decide why and how it is processed.\n\nRegistered office: [[registered office address]].\nData Protection Officer: ${NT_DPO}.`,
    collect:
      'We collect the following personal data about you:\n•  [[list the personal data this notice covers]]\n\nWe ask only for what this purpose needs. If you leave something out, we will tell you what it affects.',
    why: 'We process your personal data so that we can [[state the purpose in one plain sentence]].\n\nOur lawful basis is your consent under section 6 of the DPDP Act. You can withdraw it at any time, as easily as you gave it.',
    how: 'We collect, store and use this data only for the purpose above. Access is limited to the people who need it, and every access is logged.\n\nWe do not use your personal data to make automated decisions about you.',
    share:
      'We share your personal data only with service providers who work for us under a written contract, as section 8(2) of the DPDP Act requires.\n\n[[list the processors this activity actually uses]]\n\nWe do not sell your personal data.',
    keep: 'We keep this personal data for as long as the purpose is served, and erase it after that unless a law requires us to keep it longer.\n\n[[confirm the retention period and the rule behind it]]',
    rights: getRightsBody(),
    contact: getContactBody(),
  };
  return T[k] || '';
}

function retPhrase(r?: string): string {
  const clean = r?.trim() ?? 'until the purpose is served';
  return /^(until|as long|for |while)/i.test(clean) ? clean : `for ${clean}`;
}

export type NoticeSourceMetadata = {
  ra: string;
  act: string;
  used: [string, string][];
};

export function sectionsFromActivity(activity: ProcessingActivity): {
  sections: NoticeSection[];
  source: NoticeSourceMetadata;
} {
  const cats = activity.dataCategories;
  const catLines = cats.map((c) => `• ${c}`).join('\n');
  const purpose = activity.purpose || activity.name || 'provide our services';
  const pl = purpose.charAt(0).toLowerCase() + purpose.slice(1);
  const basisLine = `Our lawful basis is ${LAWFUL_BASIS_LABELS[activity.lawfulBasis]}.`;
  const consenty = activity.lawfulBasis === 'consent';

  const shareTxt =
    `We share your personal data only with service providers who work for us under a written contract, as section 8(2) of the DPDP Act requires.\n\n` +
    `We do not sell your personal data and we do not share it for anyone else's advertising.`;

  const S: Record<StandardSectionKey, [string, string]> = {
    who: [
      `“${NT_ORG}” means ${NT_ORG}, the Data Fiduciary for the personal data described here — we decide why and how it is processed.\n\nRegistered office: [[registered office address]].\nYou can reach our Data Protection Officer at ${NT_DPO}.`,
      `${NT_ORG} is the Data Fiduciary for this personal data: we decide the purpose and the means of processing it, and we are accountable for it under the DPDP Act.\n\nRegistered office: [[registered office address]] · Data Protection Officer: ${NT_DPO}.`,
    ],
    collect: [
      `We collect the following personal data about you:\n${catLines}\n\nWe ask only for what this purpose needs. If you leave something out, we will tell you what it affects.`,
      `This notice covers ${String(cats.length)} kinds of personal data:\n${catLines}\n\nNothing beyond this list is collected for this purpose.`,
    ],
    why: [
      `We process your personal data to ${pl}.\n\n${basisLine}${
        consenty
          ? '\n\nBecause we rely on your consent, you can withdraw it at any time — and withdrawing is as easy as giving it was.'
          : ''
      }`,
      `Purpose: to ${pl}.\n\n${basisLine} We will not use your personal data for a different purpose without telling you first.`,
    ],
    how: [
      `In practice we collect, store and use this data to ${pl}. Access is limited to the people who need it, and every access is logged.\n\nWe do not use your personal data to make automated decisions about you.`,
      `We use it only to ${pl} — collecting it, storing it securely, and referring to it when we serve you. Access is limited and logged.`,
    ],
    share: [shareTxt, shareTxt],
    keep: [
      `We keep this personal data ${retPhrase(activity.retention)}.\n\nWhen the purpose is served, or when you withdraw consent, we erase it — unless a law requires us to keep it longer. We will tell you at least 48 hours before we delete data you could still act on.`,
      `Retention: ${activity.retention || 'until the purpose is served'}. After that it is erased, unless a law requires us to keep it. You get at least 48 hours' notice before deletion.`,
    ],
    rights: [getRightsBody(), getRightsBody()],
    contact: [getContactBody(), getContactBody()],
  };

  const englishHeadings = NT_H.English ?? [];
  const sections: NoticeSection[] = STANDARD_SECTION_KEYS.map((key, i) => ({
    key,
    heading: englishHeadings[i] ?? key,
    body: S[key][0],
    alts: S[key],
    alt: 0,
  }));

  const source: NoticeSourceMetadata = {
    ra: activity.id,
    act: activity.name,
    used: [
      ['Purpose', purpose],
      ['Personal data', cats.join(', ')],
      ['Data principal', activity.principals],
      ['Recipients', 'None recorded'],
      ['Retention', activity.retention],
      ['Contact', NT_DPO],
    ],
  };

  return { sections, source };
}

export function sectionsFromDescription(description: string): {
  sections: NoticeSection[];
  name: string;
} {
  const d = description
    .trim()
    .replace(/^create (a|an) /i, '')
    .replace(/\.$/, '');
  const isEmployee = /employee|staff|payroll/i.test(d);
  const isCandidate = /candidate|applicant/i.test(d);
  const isVendor = /vendor|supplier/i.test(d);
  const who = isEmployee
    ? 'Employee'
    : isCandidate
      ? 'Candidate'
      : isVendor
        ? 'Vendor'
        : 'Customer';
  const name = `${who} Privacy Notice`;

  const pl =
    d.replace(/^privacy notice for /i, '').replace(/^notice for /i, '') || 'provide our services';
  const cats = isEmployee
    ? ['Name', 'Employee ID', 'Email', 'Phone', 'Bank account (sensitive)', 'Salary (sensitive)']
    : /analytics|website|app usage/i.test(d)
      ? ['Device identifier', 'IP address', 'Pages viewed', 'Approximate location']
      : ['Name', 'Email address', 'Phone number', 'Address'];
  const catLines = cats.map((c) => `• ${c}`).join('\n');

  const S: Record<StandardSectionKey, [string, string]> = {
    who: [
      `${NT_ORG} is the Data Fiduciary for the personal data described in this notice — we decide why and how it is processed.\n\nRegistered office: [[registered office address]].\nData Protection Officer: ${NT_DPO}.`,
      `This notice is given by ${NT_ORG}, the Data Fiduciary responsible for this personal data under the DPDP Act.\n\nRegistered office: [[registered office address]] · DPO: ${NT_DPO}.`,
    ],
    collect: [
      `We collect the following personal data about you:\n${catLines}\n\n[[confirm this list matches what the form actually collects]]`,
      `The personal data in scope:\n${catLines}\n\n[[confirm this list matches what the form actually collects]]`,
    ],
    why: [
      `We process your personal data so that we can ${pl}.\n\nOur lawful basis is your consent under section 6 of the DPDP Act. You can withdraw it at any time, as easily as you gave it.`,
      `Purpose: ${pl}.\n\nLawful basis: consent (section 6). Withdrawal is always available and as easy as giving consent.`,
    ],
    how: [
      `We collect, store and use this data only for the purpose above. Access is limited to the people who need it, and every access is logged.\n\nWe do not use it to make automated decisions about you.`,
      `We use it only for the purpose above — nothing else — and we log who reads it.`,
    ],
    share: [
      `We share your personal data only with service providers who work for us under a written contract, as section 8(2) of the DPDP Act requires.\n\n[[list the processors this activity actually uses]]\n\nWe do not sell your personal data.`,
      `Recipients: service providers acting on our instructions under a section 8(2) contract.\n\n[[list the processors this activity actually uses]]`,
    ],
    keep: [
      `We keep this personal data for as long as the purpose is served, and erase it after that unless a law requires us to keep it longer.\n\n[[confirm the retention period and the rule behind it]]`,
      `Retention: until the purpose is served, then erased — unless a law requires otherwise.\n\n[[confirm the retention period and the rule behind it]]`,
    ],
    rights: [getRightsBody(), getRightsBody()],
    contact: [getContactBody(), getContactBody()],
  };

  const englishHeadings = NT_H.English ?? [];
  const sections: NoticeSection[] = STANDARD_SECTION_KEYS.map((key, i) => ({
    key,
    heading: englishHeadings[i] ?? key,
    body: S[key][0],
    alts: S[key],
    alt: 0,
  }));

  return { sections, name };
}

export type NoticeCheckItem = {
  status: 'ok' | 'warn';
  messageKey: string;
  params?: Record<string, string | number> | undefined;
};

export type NoticeCheck = {
  isComplete: boolean;
  incompleteCount: number;
  items: NoticeCheckItem[];
  hasPlaceholders: boolean;
};

function checkItem(isOk: boolean, matchKey: string, missingKey: string): NoticeCheckItem {
  return { status: isOk ? 'ok' : 'warn', messageKey: isOk ? matchKey : missingKey };
}

function buildSectionItems(
  have: Record<string, boolean>,
  byKey: Record<string, string>,
): NoticeCheckItem[] {
  const sharesRecipients = /share|recipient|processor/i.test(byKey.share ?? '');
  const statesRetention = /keep|retention|erase/i.test(byKey.keep ?? '');

  return [
    checkItem(Boolean(have.why), 'checkPurposeMatch', 'checkPurposeMissing'),
    checkItem(Boolean(have.collect), 'checkDataMatch', 'checkDataMissing'),
    checkItem(sharesRecipients, 'checkShareMatch', 'checkShareMissing'),
    checkItem(statesRetention, 'checkKeepMatch', 'checkKeepMissing'),
    checkItem(Boolean(have.rights), 'checkRightsMatch', 'checkRightsMissing'),
  ];
}

export function computeNoticeCheck(sections: readonly NoticeSection[]): NoticeCheck {
  const byKey: Record<string, string> = {};
  const have: Record<string, boolean> = {};
  let totalPlaceholders = 0;

  for (const s of sections) {
    byKey[s.key] = s.body;
    have[s.key] = true;
    const matches = s.body.match(/\[\[[^\]]+\]\]/g);
    if (matches) totalPlaceholders += matches.length;
  }

  const missingStandard = STANDARD_SECTION_KEYS.filter((k) => !have[k]);
  const englishHeadings = NT_H.English ?? [];

  const firstCheckItem: NoticeCheckItem = {
    status: missingStandard.length === 0 ? 'ok' : 'warn',
    messageKey: missingStandard.length === 0 ? 'checkPass' : 'checkMissingSections',
  };
  if (missingStandard.length > 0) {
    firstCheckItem.params = {
      plural: missingStandard.length > 1 ? 's' : '',
      sections: missingStandard
        .map((k) => englishHeadings[STANDARD_SECTION_KEYS.indexOf(k)] ?? k)
        .join(', '),
    };
  }

  const lastCheckItem: NoticeCheckItem = {
    status: totalPlaceholders === 0 ? 'ok' : 'warn',
    messageKey: totalPlaceholders === 0 ? 'checkContactMatch' : 'checkContactMissing',
  };
  if (totalPlaceholders > 0) {
    lastCheckItem.params = { count: totalPlaceholders, plural: totalPlaceholders > 1 ? 's' : '' };
  }

  const items: NoticeCheckItem[] = [
    firstCheckItem,
    ...buildSectionItems(have, byKey),
    lastCheckItem,
  ];

  const warnCount = items.filter((i) => i.status === 'warn').length;
  return {
    isComplete: warnCount === 0,
    incompleteCount: totalPlaceholders,
    items,
    hasPlaceholders: totalPlaceholders > 0,
  };
}
