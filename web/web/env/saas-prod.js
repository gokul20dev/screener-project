const DOMAIN_URL = "https://api.screener.digi-val.com/api";

const API_VERSION = "v1";

const base_url = DOMAIN_URL + "/" + API_VERSION;

const API_UPLOAD = base_url + "/upload";
const EXAM_END_POINT = base_url + "/entrance-exam";
const ATTENDER_END_POINT = base_url + "/attender";

const EXAM_ATTENDER_END_POINT = EXAM_END_POINT + "/attender";
const REPORT_END_POINT = EXAM_END_POINT + "/report";
const STUDENT_END_POINT = EXAM_END_POINT + "/student";
const QUESTIONS_END_POINT = EXAM_END_POINT + "/question";
const ACCOUNT_END_POINT = base_url + "/account";
const USER_END_POINT = base_url + "/user";
const INSIGHT_END_POINT = base_url + "/insight";
const TAG_END_POINT = base_url + "/tag";
const GROUP_END_POINT = base_url + "/attender-group";
const ACTIVITY_LOG_END_POINT = base_url + "/activity-log"
const CREDIT_END_POINT = base_url + "/credit";
const CERTIFICATE_END_POINT = ACCOUNT_END_POINT +"/certificate";
const LABEL_END_POINT = base_url+"/account/label"

const AWS_CLOUD_URL = "https://unify.screener.digi-val.com";
const AWS_BASE_URL = `${AWS_CLOUD_URL}/api/v1`;

const GCP_CLOUD_URL =
  "https://me-central2-prod-sajil-454012.cloudfunctions.net/prod-sajil-video-cfn-01";
const SERVICE_BASE_URL = "https://gcp-video-process-1030409224402.asia-south1.run.app";

const ApiKey = "d>A9~5I+65jk";

const apiheaders = { "x-api-key": ApiKey };

const apiHeaders = { "x-api-key": ApiKey };

let national_ID_Arabic = "الرجاء إدخال رمز المرور الخاص بك";
let sla_ID_Arabic = "رمز المرور";
let national_ID = "Please Enter Passcode";
let sla_ID = "Passcode";

const APPROVED = "APPROVED";
const NOT_REGISTERED = "NOT_REGISTERED";
const REGISTERED = "REGISTERED";
const REJECTED = "REJECTED";
const PENDING = "Pending";
const SENDING = "Sending";
const SENT = "Sent";
const ADMIN = "admin";
const SUPERADMIN = "superAdmin";
const FACULTY = "faculty";
const ENDED = "ENDED";
const ON_GOING = "ON_GOING";
const FINALIZED = "FINALIZED"

const KEY = "2291ea0ef1b4019086b086c4815ae7fdf371278fa48584ad7f9e4fb40f00375e";
const SALT_KEY = "D1g!Scr33n3r#Dv2025@v0.1$Xz7^Lp*RgT!";
const HASH_COUNT = 1000;

const statusConfig = {
  registration: {
    NOT_REGISTERED: {
      label: "Not registered",
      class: "status-chip-not-registered",
    },
    REJECTED: { label: "Rejected", class: "status-chip-rejected" },
    REGISTERED: { label: "Registered", class: "status-chip-registered" },
    APPROVED: { label: "Approved", class: "status-chip-approved" },
  },
  invite: {
    P: { label: "Pending", class: "status-pending" },
    Q: { label: "Sending", class: "status-sending" },
    S: { label: "Sent", class: "status-sent" },
    F: { label: "Failed", class: "status-failed" },
  },
};

const CONFIG = {
  EXPIRY_TIME: 604800,
  API: {
    ENDPOINTS: {
      CHUNK_UPLOAD: `${AWS_BASE_URL}/upload`,
    },
  },
  APP: "DA",
  BUCKET: "digi-screener",
  FOLDERNAME: "entrance-exam",
  CLOUD_SERVICE: "gcp",
};

const QuestionTypes = [
  { 
    name: "MCQ (Multiple Choice Question)", 
    value: "MCQ",
    description: "Create questions with multiple options where students select one correct answer. Ideal for testing factual knowledge and understanding."
  },
  { 
    name: "FTB (Fill the Blanks)", 
    value: "FTB",
    description: "Create sentences with missing words that students must fill in. Perfect for testing vocabulary, concepts, and specific terms."
  },
  { 
    name: "SAQ (Short Answer Question)", 
    value: "SAQ",
    description: "Ask open-ended questions requiring brief written responses. Great for assessing comprehension and critical thinking."
  },
  { 
    name: "PRQ (Programming Response Question)", 
    value: "PRQ",
    description: "Students write and execute code to solve problems. Supports multiple programming languages with syntax highlighting."
  },
  { 
    name: "IR (Image Response)", 
    value: "IR",
    description: "Students can draw, annotate, or upload images as their answer. Useful for diagrams, sketches, and visual responses."
  },
  { 
    name: "UD (Upload Document)", 
    value: "UD",
    description: "Allow students to upload files (PDF, Word, etc.) as their response. Suitable for essays, reports, or assignments."
  },
  { 
    name: "TF (True False)", 
    value: "TF",
    description: "Simple true/false questions for quick assessment of understanding. Effective for testing factual knowledge."
  },
  { 
    name: "MTF (Matching Type Question)", 
    value: "MTF",
    description: "Students match items from two columns. Excellent for testing relationships between concepts, terms, and definitions."
  },
  { 
    name: "OR (Ordering Question)", 
    value: "OR",
    description: "Students arrange items in the correct sequence. Perfect for testing understanding of processes, timelines, or hierarchies."
  },
  { 
    name: "TAB (Table Based Question)", 
    value: "TAB",
    description: "Create questions with tabular data where students fill specific cells. Ideal for calculations, data analysis, and structured responses."
  },
];

const programmingLanguages = [
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "html", name: "HTML" },
  { id: "css", name: "CSS" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "csharp", name: "C#" },
  { id: "php", name: "PHP" },
  { id: "sql", name: "SQL" },
  { id: "c", name: "C" },
  { id: "cpp", name: "C++" },
];

// Piston API configuration
const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

// Map our language values to Piston language values
const PISTON_LANGUAGE_MAP = {
  javascript: {
    language: "javascript",
    version: "18.15.0",
  },
  typescript: {
    language: "typescript",
    version: "5.0.3",
  },
  python: {
    language: "python",
    version: "3.10.0",
  },
  java: {
    language: "java",
    version: "15.0.2",
  },
  c: {
    language: "c",
    version: "10.2.0",
  },
  cpp: {
    language: "c++",
    version: "10.2.0",
  },
  csharp: {
    language: "csharp",
    version: "6.12.0",
  },
  php: {
    language: "php",
    version: "8.2.3",
  },
  html: {
    language: "html",
    version: "5.0.0",
  },
  css: {
    language: "css",
    version: "3.0.0",
  },
  sql: {
    language: "sqlite",
    version: "3.36.0",
  },
};

const themes = [
  { id: "vs", name: "Light" },
  { id: "vs-dark", name: "Dark" },
  { id: "hc-black", name: "High Contrast" },
];

let registrationEmailContent = `<p class="email-content">Dear <strong>student id</strong>,<br><br>
You have been registered for the upcoming <strong>Exam Name</strong>.<br><br>
To complete your registration, <strong>Link URL EN</strong><br><br>
Important Instructions:<br>
• Please ensure you have a stable internet connection<br>
• Keep your ID proof ready for verification<br>
• Complete your registration at least 24 hours before the exam<br><br>
For any technical assistance, please contact your exam coordinator.<br><br>
<hr>
<p class="email-content" dir="rtl">
لقد تم تسجيلك في <strong>Exam Name</strong> القادم.<br><br>
لإكمال التسجيل،<strong>Link URL AR</strong><br><br>
تعليمات مهمة:<br>
• يرجى التأكد من وجود اتصال مستقر بالإنترنت<br>
• احتفظ بإثبات الهوية جاهزًا للتحقق<br>
• أكمل تسجيلك قبل 24 ساعة على الأقل من الامتحان<br><br>
للحصول على المساعدة التقنية، يرجى الاتصال بمنسق الامتحان.<br><br>
<span style="text-align: left; display: block;" dir="ltr">Best Regards,<br>
<strong>Client Name</strong></span></p>`;

let invitationEmailContent = `<p class="email-content">Dear <strong>student id</strong>,<br><br>
Your examination <strong>Exam Name</strong> has been scheduled for <strong>exam_date</strong>.<br><br>
To start your exam, <strong>Link URL EN</strong><br><br>
<strong>Pass Code EN</strong><br><br>
Important Guidelines:<br>
• Login 15 minutes before the exam start time<br>
• Ensure webcam and microphone are working<br>
• Keep your ID card ready for verification<br>
• Use latest version of supported browser<br>
• Maintain stable internet connection<br><br>
Good luck for your examination!<br><br>

<hr>
<p class="email-content" dir="rtl">
تم جدولة امتحانك <strong>Exam Name</strong>student id<strong>exam_date</strong>.<br><br>
لبدء الامتحان،<strong>Link URL AR</strong><br><br>
<strong>Pass Code AR</strong><br><br>
إرشادات مهمة:<br>
• تسجيل الدخول قبل 15 دقيقة من وقت بدء الامتحان<br>
• تأكد من عمل كاميرا الويب والميكروفون<br>
• احتفظ ببطاقة الهوية جاهزة للتحقق<br>
• استخدم أحدث إصدار من المتصفح المدعوم<br>
• حافظ على اتصال مستقر بالإنترنت<br><br>
حظًا موفقًا في امتحانك!<br><br>
<span style="text-align: left; display: block;" dir="ltr">Best Regards,<br>
<strong>Client Name</strong></span></p>`;

let reportEmailContent = `<p class="email-content">Dear <strong>student id</strong>,<br><br>
We are pleased to inform you that your examination results for <strong>Exam Name</strong> have been published.<br><br>
You can view your results by clicking the link below:<br>
<strong>Link URL EN</strong><br><br>
Important Information:<br>
• Please review your results carefully.<br>
• If you have any questions or concerns regarding your results, do not hesitate to contact your exam coordinator.<br>
• Ensure to keep your ID proof ready for any verification if required.<br><br>
Thank you for your participation, and we wish you the best in your future endeavors!<br><br>

<hr>
<p class="email-content" dir="rtl">
يسرنا إبلاغك بأنه تم نشر نتائج امتحانك لـ <strong>Exam Name</strong>.<br><br>
يمكنك عرض نتائجك بالنقر على الرابط أدناه:<br>
<strong>Link URL AR</strong><br><br>
معلومات مهمة:<br>
• يرجى مراجعة نتائجك بعناية.<br>
• إذا كانت لديك أي أسئلة أو استفسارات بخصوص نتائجك، فلا تتردد في الاتصال بمنسق الامتحان.<br>
• تأكد من الاحتفاظ بإثبات الهوية جاهزًا لأي تحقق إذا لزم الأمر.<br><br>
شكرًا على مشاركتك، ونتمنى لك التوفيق في مساعيك المستقبلية!<br><br>
<span style="text-align: left; display: block;" dir="ltr">Best Regards,<br>
<strong>Client Name</strong></span></p>`;

let registrationSubject = "Registration for Exam";
let invitationSubject = "Invitation for Exam";
let reportSubject = "Report for Exam";

// Add the standardTimezones array here
const standardTimezones = [
  {
    offset: "(UTC-12:00)",
    name: "International Date Line West (United States Minor Outlying Islands)",
    identifier: "Etc/GMT+12",
    arabic_name:
      "خط التاريخ الدولي الغربي (جزر الولايات المتحدة النائية الصغرى)",
  },
  {
    offset: "(UTC-11:00)",
    name: "Coordinated Universal Time-11 (United States Minor Outlying Islands)",
    identifier: "Etc/GMT+11",
    arabic_name:
      "التوقيت العالمي المنسق-11 (جزر الولايات المتحدة النائية الصغرى)",
  },
  {
    offset: "(UTC-10:00)",
    name: "Aleutian Islands (United States)",
    identifier: "America/Adak",
    arabic_name: "جزر أليوتيان (الولايات المتحدة)",
  },
  {
    offset: "(UTC-10:00)",
    name: "Hawaii (United States)",
    identifier: "Pacific/Honolulu",
    arabic_name: "هاواي (الولايات المتحدة)",
  },
  {
    offset: "(UTC-09:30)",
    name: "Marquesas Islands (French Polynesia)",
    identifier: "Pacific/Marquesas",
    arabic_name: "جزر ماركيساس (بولينيزيا الفرنسية)",
  },
  {
    offset: "(UTC-09:00)",
    name: "Alaska (United States)",
    identifier: "America/Anchorage",
    arabic_name: "ألاسكا (الولايات المتحدة)",
  },
  {
    offset: "(UTC-09:00)",
    name: "Coordinated Universal Time-09 (United States)",
    identifier: "Etc/GMT+9",
    arabic_name: "التوقيت العالمي المنسق-09 (الولايات المتحدة)",
  },
  {
    offset: "(UTC-08:00)",
    name: "Baja California (Mexico)",
    identifier: "America/Tijuana",
    arabic_name: "باها كاليفورنيا (المكسيك)",
  },
  {
    offset: "(UTC-08:00)",
    name: "Coordinated Universal Time-08 (United States)",
    identifier: "Etc/GMT+8",
    arabic_name: "التوقيت العالمي المنسق-08 (الولايات المتحدة)",
  },
  {
    offset: "(UTC-08:00)",
    name: "Pacific Time (United States & Canada)",
    identifier: "America/Los_Angeles",
    arabic_name: "توقيت المحيط الهادئ (الولايات المتحدة وكندا)",
  },
  {
    offset: "(UTC-07:00)",
    name: "Arizona (United States)",
    identifier: "America/Phoenix",
    arabic_name: "أريزونا (الولايات المتحدة)",
  },
  {
    offset: "(UTC-07:00)",
    name: "Chihuahua, La Paz, Mazatlan (Mexico)",
    identifier: "America/Chihuahua",
    arabic_name: "تشيواوا، لا باز، مازاتلان (المكسيك)",
  },
  {
    offset: "(UTC-07:00)",
    name: "Mountain Time (United States & Canada)",
    identifier: "America/Denver",
    arabic_name: "التوقيت الجبلي (الولايات المتحدة وكندا)",
  },
  {
    offset: "(UTC-06:00)",
    name: "Central America (Various Countries)",
    identifier: "America/Guatemala",
    arabic_name: "أمريكا الوسطى (دول مختلفة)",
  },
  {
    offset: "(UTC-06:00)",
    name: "Central Time (United States & Canada)",
    identifier: "America/Chicago",
    arabic_name: "التوقيت المركزي (الولايات المتحدة وكندا)",
  },
  {
    offset: "(UTC-06:00)",
    name: "Easter Island (Chile)",
    identifier: "Pacific/Easter",
    arabic_name: "جزيرة القيامة (تشيلي)",
  },
  {
    offset: "(UTC-06:00)",
    name: "Guadalajara, Mexico City, Monterrey (Mexico)",
    identifier: "America/Mexico_City",
    arabic_name: "غوادالاخارا، مدينة المكسيك، مونتيري (المكسيك)",
  },
  {
    offset: "(UTC-06:00)",
    name: "Saskatchewan (Canada)",
    identifier: "America/Regina",
    arabic_name: "ساسكاتشوان (كندا)",
  },
  {
    offset: "(UTC-05:00)",
    name: "Bogota, Lima, Quito, Rio Branco (Colombia, Peru, Ecuador, Brazil)",
    identifier: "America/Bogota",
    arabic_name:
      "بوغوتا، ليما، كيتو، ريو برانكو (كولومبيا، بيرو، الإكوادور، البرازيل)",
  },
  {
    offset: "(UTC-05:00)",
    name: "Chetumal (Mexico)",
    identifier: "America/Cancun",
    arabic_name: "تشيتومال (المكسيك)",
  },
  {
    offset: "(UTC-05:00)",
    name: "Eastern Time (United States & Canada)",
    identifier: "America/New_York",
    arabic_name: "التوقيت الشرقي (الولايات المتحدة وكندا)",
  },
  {
    offset: "(UTC-05:00)",
    name: "Haiti",
    identifier: "America/Port-au-Prince",
    arabic_name: "هايتي",
  },
  {
    offset: "(UTC-05:00)",
    name: "Havana (Cuba)",
    identifier: "America/Havana",
    arabic_name: "هافانا (كوبا)",
  },
  {
    offset: "(UTC-05:00)",
    name: "Indiana (East) (United States)",
    identifier: "America/Indiana/Indianapolis",
    arabic_name: "إنديانا (شرق) (الولايات المتحدة)",
  },
  {
    offset: "(UTC-04:00)",
    name: "Asuncion (Paraguay)",
    identifier: "America/Asuncion",
    arabic_name: "أسونسيون (باراغواي)",
  },
  {
    offset: "(UTC-04:00)",
    name: "Atlantic Time (Canada)",
    identifier: "America/Halifax",
    arabic_name: "توقيت الأطلسي (كندا)",
  },
  {
    offset: "(UTC-04:00)",
    name: "Caracas (Venezuela)",
    identifier: "America/Caracas",
    arabic_name: "كراكاس (فنزويلا)",
  },
  {
    offset: "(UTC-04:00)",
    name: "Cuiaba (Brazil)",
    identifier: "America/Cuiaba",
    arabic_name: "كويابا (البرازيل)",
  },
  {
    offset: "(UTC-04:00)",
    name: "Georgetown, La Paz, Manaus, San Juan (Guyana, Bolivia, Brazil, Puerto Rico)",
    identifier: "America/Manaus",
    arabic_name:
      "جورج تاون، لا باز، ماناوس، سان خوان (غيانا، بوليفيا، البرازيل، بورتوريكو)",
  },
  {
    offset: "(UTC-04:00)",
    name: "Santiago (Chile)",
    identifier: "America/Santiago",
    arabic_name: "سانتياغو (تشيلي)",
  },
  {
    offset: "(UTC-03:30)",
    name: "Newfoundland (Canada)",
    identifier: "America/St_Johns",
    arabic_name: "نيوفاوندلاند (كندا)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Araguaina (Brazil)",
    identifier: "America/Araguaina",
    arabic_name: "أراغواينا (البرازيل)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Brasilia (Brazil)",
    identifier: "America/Sao_Paulo",
    arabic_name: "برازيليا (البرازيل)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Cayenne, Fortaleza (French Guiana, Brazil)",
    identifier: "America/Cayenne",
    arabic_name: "كايين، فورتاليزا (غيانا الفرنسية، البرازيل)",
  },
  {
    offset: "(UTC-03:00)",
    name: "City of Buenos Aires (Argentina)",
    identifier: "America/Argentina/Buenos_Aires",
    arabic_name: "مدينة بوينس آيرس (الأرجنتين)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Greenland (Denmark)",
    identifier: "America/Godthab",
    arabic_name: "غرينلاند (الدنمارك)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Montevideo (Uruguay)",
    identifier: "America/Montevideo",
    arabic_name: "مونتيفيديو (أوروغواي)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Saint Pierre and Miquelon (France)",
    identifier: "America/Miquelon",
    arabic_name: "سانت بيير وميكيلون (فرنسا)",
  },
  {
    offset: "(UTC-03:00)",
    name: "Salvador (Brazil)",
    identifier: "America/Bahia",
    arabic_name: "سلفادور (البرازيل)",
  },
  {
    offset: "(UTC-02:00)",
    name: "Coordinated Universal Time-02 (South Georgia and the South Sandwich Islands)",
    identifier: "Etc/GMT+2",
    arabic_name:
      "التوقيت العالمي المنسق-02 (جورجيا الجنوبية وجزر ساندويتش الجنوبية)",
  },
  {
    offset: "(UTC-01:00)",
    name: "Azores (Portugal)",
    identifier: "Atlantic/Azores",
    arabic_name: "جزر الأزور (البرتغال)",
  },
  {
    offset: "(UTC-01:00)",
    name: "Cabo Verde Is. (Cape Verde)",
    identifier: "Atlantic/Cape_Verde",
    arabic_name: "جزر الرأس الأخضر (الرأس الأخضر)",
  },
  {
    offset: "(UTC+00:00)",
    name: "Coordinated Universal Time (International)",
    identifier: "Etc/UTC",
    arabic_name: "التوقيت العالمي المنسق (دولي)",
  },
  {
    offset: "(UTC+00:00)",
    name: "Dublin, Edinburgh, Lisbon, London (Ireland, UK, Portugal)",
    identifier: "Europe/London",
    arabic_name:
      "دبلن، إدنبرة، لشبونة، لندن (أيرلندا، المملكة المتحدة، البرتغال)",
  },
  {
    offset: "(UTC+00:00)",
    name: "Monrovia, Reykjavik (Liberia, Iceland)",
    identifier: "Atlantic/Reykjavik",
    arabic_name: "مونروفيا، ريكيافيك (ليبيريا، آيسلندا)",
  },
  {
    offset: "(UTC+01:00)",
    name: "Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna (Netherlands, Germany, Switzerland, Italy, Sweden, Austria)",
    identifier: "Europe/Berlin",
    arabic_name:
      "أمستردام، برلين، برن، روما، ستوكهولم، فيينا (هولندا، ألمانيا، سويسرا، إيطاليا، السويد، النمسا)",
  },
  {
    offset: "(UTC+01:00)",
    name: "Belgrade, Bratislava, Budapest, Ljubljana, Prague (Serbia, Slovakia, Hungary, Slovenia, Czech Republic)",
    identifier: "Europe/Budapest",
    arabic_name:
      "بلغراد، براتيسلافا، بودابست، ليوبليانا، براغ (صربيا، سلوفاكيا، المجر، سلوفينيا، جمهورية التشيك)",
  },
  {
    offset: "(UTC+01:00)",
    name: "Brussels, Copenhagen, Madrid, Paris (Belgium, Denmark, Spain, France)",
    identifier: "Europe/Paris",
    arabic_name:
      "بروكسل، كوبنهاغن، مدريد، باريس (بلجيكا، الدنمارك، إسبانيا، فرنسا)",
  },
  {
    offset: "(UTC+01:00)",
    name: "Casablanca (Morocco)",
    identifier: "Africa/Casablanca",
    arabic_name: "الدار البيضاء (المغرب)",
  },
  {
    offset: "(UTC+01:00)",
    name: "Sarajevo, Skopje, Warsaw, Zagreb (Bosnia and Herzegovina, North Macedonia, Poland, Croatia)",
    identifier: "Europe/Warsaw",
    arabic_name:
      "سراييفو، سكوبيه، وارسو، زغرب (البوسنة والهرسك، مقدونيا الشمالية، بولندا، كرواتيا)",
  },
  {
    offset: "(UTC+01:00)",
    name: "West Central Africa (Nigeria)",
    identifier: "Africa/Lagos",
    arabic_name: "غرب وسط أفريقيا (نيجيريا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Amman (Jordan)",
    identifier: "Asia/Amman",
    arabic_name: "عمان (الأردن)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Athens, Bucharest (Greece, Romania)",
    identifier: "Europe/Athens",
    arabic_name: "أثينا، بوخارست (اليونان، رومانيا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Beirut (Lebanon)",
    identifier: "Asia/Beirut",
    arabic_name: "بيروت (لبنان)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Cairo (Egypt)",
    identifier: "Africa/Cairo",
    arabic_name: "القاهرة (مصر)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Chisinau (Moldova)",
    identifier: "Europe/Chisinau",
    arabic_name: "كيشيناو (مولدوفا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Damascus (Syria)",
    identifier: "Asia/Damascus",
    arabic_name: "دمشق (سوريا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Harare, Pretoria (Zimbabwe, South Africa)",
    identifier: "Africa/Johannesburg",
    arabic_name: "هراري، بريتوريا (زيمبابوي، جنوب أفريقيا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius (Finland, Ukraine, Latvia, Bulgaria, Estonia, Lithuania)",
    identifier: "Europe/Helsinki",
    arabic_name:
      "هلسنكي، كييف، ريغا، صوفيا، تالين، فيلنيوس (فنلندا، أوكرانيا، لاتفيا، بلغاريا، إستونيا، ليتوانيا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Jerusalem (Israel)",
    identifier: "Asia/Jerusalem",
    arabic_name: "القدس (إسرائيل)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Kaliningrad (Russia)",
    identifier: "Europe/Kaliningrad",
    arabic_name: "كالينينغراد (روسيا)",
  },
  {
    offset: "(UTC+02:00)",
    name: "Tripoli (Libya)",
    identifier: "Africa/Tripoli",
    arabic_name: "طرابلس (ليبيا)",
  },
  {
    offset: "(UTC+03:00)",
    name: "Baghdad (Iraq)",
    identifier: "Asia/Baghdad",
    arabic_name: "بغداد (العراق)",
  },
  {
    offset: "(UTC+03:00)",
    name: "Istanbul (Turkey)",
    identifier: "Europe/Istanbul",
    arabic_name: "إسطنبول (تركيا)",
  },
  {
    offset: "(UTC+03:00)",
    name: "Kuwait, Riyadh (Saudi Arabia)",
    identifier: "Asia/Riyadh",
    arabic_name: "الكويت، الرياض (المملكة العربية السعودية)",
  },
  {
    offset: "(UTC+03:00)",
    name: "Minsk (Belarus)",
    identifier: "Europe/Minsk",
    arabic_name: "مينسك (بيلاروسيا)",
  },
  {
    offset: "(UTC+03:00)",
    name: "Moscow, St. Petersburg, Volgograd (Russia)",
    identifier: "Europe/Moscow",
    arabic_name: "موسكو، سانت بطرسبرغ، فولغوغراد (روسيا)",
  },
  {
    offset: "(UTC+03:00)",
    name: "Nairobi (Kenya)",
    identifier: "Africa/Nairobi",
    arabic_name: "نيروبي (كينيا)",
  },
  {
    offset: "(UTC+03:30)",
    name: "Tehran (Iran)",
    identifier: "Asia/Tehran",
    arabic_name: "طهران (إيران)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Abu Dhabi, Muscat (UAE, Oman)",
    identifier: "Asia/Dubai",
    arabic_name: "أبو ظبي، مسقط (الإمارات العربية المتحدة، عمان)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Astrakhan, Ulyanovsk (Russia)",
    identifier: "Europe/Astrakhan",
    arabic_name: "أستراخان، أوليانوفسك (روسيا)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Baku (Azerbaijan)",
    identifier: "Asia/Baku",
    arabic_name: "باكو (أذربيجان)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Izhevsk, Samara (Russia)",
    identifier: "Europe/Samara",
    arabic_name: "إيجيفسك، سامارا (روسيا)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Port Louis (Mauritius)",
    identifier: "Indian/Mauritius",
    arabic_name: "بورت لويس (موريشيوس)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Tbilisi (Georgia)",
    identifier: "Asia/Tbilisi",
    arabic_name: "تبليسي (جورجيا)",
  },
  {
    offset: "(UTC+04:00)",
    name: "Yerevan (Armenia)",
    identifier: "Asia/Yerevan",
    arabic_name: "يريفان (أرمينيا)",
  },
  {
    offset: "(UTC+04:30)",
    name: "Kabul (Afghanistan)",
    identifier: "Asia/Kabul",
    arabic_name: "كابول (أفغانستان)",
  },
  {
    offset: "(UTC+05:00)",
    name: "Ashgabat, Tashkent (Turkmenistan, Uzbekistan)",
    identifier: "Asia/Tashkent",
    arabic_name: "عشق آباد، طشقند (تركمانستان، أوزبكستان)",
  },
  {
    offset: "(UTC+05:00)",
    name: "Ekaterinburg (Russia)",
    identifier: "Asia/Yekaterinburg",
    arabic_name: "يكاترينبورغ (روسيا)",
  },
  {
    offset: "(UTC+05:00)",
    name: "Islamabad, Karachi (Pakistan)",
    identifier: "Asia/Karachi",
    arabic_name: "إسلام آباد، كراتشي (باكستان)",
  },
  {
    offset: "(UTC+05:30)",
    name: "Chennai, Kolkata, Mumbai, New Delhi (India)",
    identifier: "Asia/Kolkata",
    arabic_name: "تشيناي، كولكاتا، مومباي، نيودلهي (الهند)",
  },
  {
    offset: "(UTC+05:30)",
    name: "Sri Jayawardenepura (Sri Lanka)",
    identifier: "Asia/Colombo",
    arabic_name: "سري جاياواردينيبورا (سريلانكا)",
  },
  {
    offset: "(UTC+05:45)",
    name: "Kathmandu (Nepal)",
    identifier: "Asia/Kathmandu",
    arabic_name: "كاتماندو (نيبال)",
  },
  {
    offset: "(UTC+06:00)",
    name: "Astana (Kazakhstan)",
    identifier: "Asia/Almaty",
    arabic_name: "أستانا (كازاخستان)",
  },
  {
    offset: "(UTC+06:00)",
    name: "Dhaka (Bangladesh)",
    identifier: "Asia/Dhaka",
    arabic_name: "دكا (بنغلاديش)",
  },
  {
    offset: "(UTC+06:00)",
    name: "Omsk (Russia)",
    identifier: "Asia/Omsk",
    arabic_name: "أومسك (روسيا)",
  },
  {
    offset: "(UTC+06:30)",
    name: "Yangon (Myanmar)",
    identifier: "Asia/Yangon",
    arabic_name: "يانغون (ميانمار)",
  },
  {
    offset: "(UTC+07:00)",
    name: "Bangkok, Hanoi, Jakarta (Thailand, Vietnam, Indonesia)",
    identifier: "Asia/Bangkok",
    arabic_name: "بانكوك، هانوي، جاكرتا (تايلاند، فيتنام، إندونيسيا)",
  },
  {
    offset: "(UTC+07:00)",
    name: "Barnaul, Gorno-Altaysk (Russia)",
    identifier: "Asia/Barnaul",
    arabic_name: "بارناول، غورنو-ألتايسك (روسيا)",
  },
  {
    offset: "(UTC+07:00)",
    name: "Hovd (Mongolia)",
    identifier: "Asia/Hovd",
    arabic_name: "هوفد (منغوليا)",
  },
  {
    offset: "(UTC+07:00)",
    name: "Krasnoyarsk (Russia)",
    identifier: "Asia/Krasnoyarsk",
    arabic_name: "كراسنويارسك (روسيا)",
  },
  {
    offset: "(UTC+07:00)",
    name: "Novosibirsk (Russia)",
    identifier: "Asia/Novosibirsk",
    arabic_name: "نوفوسيبيرسك (روسيا)",
  },
  {
    offset: "(UTC+07:00)",
    name: "Tomsk (Russia)",
    identifier: "Asia/Tomsk",
    arabic_name: "تومسك (روسيا)",
  },
  {
    offset: "(UTC+08:00)",
    name: "Beijing, Chongqing, Hong Kong, Urumqi (China)",
    identifier: "Asia/Shanghai",
    arabic_name: "بكين، تشونغتشينغ، هونغ كونغ، أورومتشي (الصين)",
  },
  {
    offset: "(UTC+08:00)",
    name: "Irkutsk (Russia)",
    identifier: "Asia/Irkutsk",
    arabic_name: "إركوتسك (روسيا)",
  },
  {
    offset: "(UTC+08:00)",
    name: "Kuala Lumpur, Singapore (Malaysia)",
    identifier: "Asia/Singapore",
    arabic_name: "كوالالمبور، سنغافورة (ماليزيا)",
  },
  {
    offset: "(UTC+08:00)",
    name: "Perth (Australia)",
    identifier: "Australia/Perth",
    arabic_name: "بيرث (أستراليا)",
  },
  {
    offset: "(UTC+08:00)",
    name: "Taipei (Taiwan)",
    identifier: "Asia/Taipei",
    arabic_name: "تايبيه (تايوان)",
  },
  {
    offset: "(UTC+08:00)",
    name: "Ulaanbaatar (Mongolia)",
    identifier: "Asia/Ulaanbaatar",
    arabic_name: "أولان باتور (منغوليا)",
  },
  {
    offset: "(UTC+08:45)",
    name: "Eucla (Australia)",
    identifier: "Australia/Eucla",
    arabic_name: "يوكلا (أستراليا)",
  },
  {
    offset: "(UTC+09:00)",
    name: "Chita (Russia)",
    identifier: "Asia/Chita",
    arabic_name: "تشيتا (روسيا)",
  },
  {
    offset: "(UTC+09:00)",
    name: "Osaka, Sapporo, Tokyo (Japan)",
    identifier: "Asia/Tokyo",
    arabic_name: "أوساكا، سابورو، طوكيو (اليابان)",
  },
  {
    offset: "(UTC+09:00)",
    name: "Pyongyang (North Korea)",
    identifier: "Asia/Pyongyang",
    arabic_name: "بيونغ يانغ (كوريا الشمالية)",
  },
  {
    offset: "(UTC+09:00)",
    name: "Seoul (South Korea)",
    identifier: "Asia/Seoul",
    arabic_name: "سيول (كوريا الجنوبية)",
  },
  {
    offset: "(UTC+09:00)",
    name: "Yakutsk (Russia)",
    identifier: "Asia/Yakutsk",
    arabic_name: "ياكوتسك (روسيا)",
  },
  {
    offset: "(UTC+09:30)",
    name: "Adelaide (Australia)",
    identifier: "Australia/Adelaide",
    arabic_name: "أديليد (أستراليا)",
  },
  {
    offset: "(UTC+09:30)",
    name: "Darwin (Australia)",
    identifier: "Australia/Darwin",
    arabic_name: "داروين (أستراليا)",
  },
  {
    offset: "(UTC+10:00)",
    name: "Brisbane (Australia)",
    identifier: "Australia/Brisbane",
    arabic_name: "بريسبان (أستراليا)",
  },
  {
    offset: "(UTC+10:00)",
    name: "Canberra, Melbourne, Sydney (Australia)",
    identifier: "Australia/Sydney",
    arabic_name: "كانبرا، ملبورن، سيدني (أستراليا)",
  },
  {
    offset: "(UTC+10:00)",
    name: "Guam, Port Moresby (Papua New Guinea)",
    identifier: "Pacific/Port_Moresby",
    arabic_name: "غوام، بورت مورسبي (بابوا غينيا الجديدة)",
  },
  {
    offset: "(UTC+10:00)",
    name: "Hobart (Australia)",
    identifier: "Australia/Hobart",
    arabic_name: "هوبارت (أستراليا)",
  },
  {
    offset: "(UTC+10:00)",
    name: "Vladivostok (Russia)",
    identifier: "Asia/Vladivostok",
    arabic_name: "فلاديفوستوك (روسيا)",
  },
  {
    offset: "(UTC+10:30)",
    name: "Lord Howe Island (Australia)",
    identifier: "Australia/Lord_Howe",
    arabic_name: "جزيرة لورد هاو (أستراليا)",
  },
  {
    offset: "(UTC+11:00)",
    name: "Bougainville Island (Papua New Guinea)",
    identifier: "Pacific/Bougainville",
    arabic_name: "جزيرة بوغانفيل (بابوا غينيا الجديدة)",
  },
  {
    offset: "(UTC+11:00)",
    name: "Magadan (Russia)",
    identifier: "Asia/Magadan",
    arabic_name: "ماغادان (روسيا)",
  },
  {
    offset: "(UTC+11:00)",
    name: "Norfolk Island (Australia)",
    identifier: "Pacific/Norfolk",
    arabic_name: "جزيرة نورفولك (أستراليا)",
  },
  {
    offset: "(UTC+11:00)",
    name: "Sakhalin (Russia)",
    identifier: "Asia/Sakhalin",
    arabic_name: "ساخالين (روسيا)",
  },
  {
    offset: "(UTC+11:00)",
    name: "Solomon Islands, New Caledonia (France)",
    identifier: "Pacific/Guadalcanal",
    arabic_name: "جزر سليمان، كاليدونيا الجديدة (فرنسا)",
  },
  {
    offset: "(UTC+12:00)",
    name: "Anadyr, Petropavlovsk-Kamchatsky (Russia)",
    identifier: "Asia/Kamchatka",
    arabic_name: "أنادير، بتروبافلوفسك-كامتشاتسكي (روسيا)",
  },
  {
    offset: "(UTC+12:00)",
    name: "Auckland, Wellington (New Zealand)",
    identifier: "Pacific/Auckland",
    arabic_name: "أوكلاند، ويلينغتون (نيوزيلندا)",
  },
  {
    offset: "(UTC+12:00)",
    name: "Coordinated Universal Time+12 (International)",
    identifier: "Etc/GMT-12",
    arabic_name: "التوقيت العالمي المنسق+12 (دولي)",
  },
  {
    offset: "(UTC+12:00)",
    name: "Fiji",
    identifier: "Pacific/Fiji",
    arabic_name: "فيجي",
  },
  {
    offset: "(UTC+12:45)",
    name: "Chatham Islands (New Zealand)",
    identifier: "Pacific/Chatham",
    arabic_name: "جزر تشاتام (نيوزيلندا)",
  },
  {
    offset: "(UTC+13:00)",
    name: "Nuku'alofa (Tonga)",
    identifier: "Pacific/Tongatapu",
    arabic_name: "نوكو ألوفا (تونغا)",
  },
  {
    offset: "(UTC+13:00)",
    name: "Samoa",
    identifier: "Pacific/Apia",
    arabic_name: "ساموا",
  },
  {
    offset: "(UTC+14:00)",
    name: "Kiritimati Island (Kiribati)",
    identifier: "Pacific/Kiritimati",
    arabic_name: "جزيرة كيريتيماتي (كيريباتي)",
  },
];
