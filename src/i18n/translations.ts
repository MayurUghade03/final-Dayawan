export type Lang = "mr" | "hi" | "en";

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: "mr", label: "मराठी", short: "MR" },
  { code: "hi", label: "हिंदी", short: "HI" },
  { code: "en", label: "English", short: "EN" },
];

type Dict = Record<string, { mr: string; hi: string; en: string }>;

export const t: Dict = {
  brand: { mr: "दयावान मल्टीसर्व्हिसेस", hi: "दयावान मल्टीसर्विसेस", en: "Dayawan Multiservices" },
  brand_tag: { mr: "विश्वासू सेवा केंद्र", hi: "भरोसेमंद सेवा केंद्र", en: "Trusted Service Center" },

  nav_home: { mr: "मुख्यपृष्ठ", hi: "होम", en: "Home" },
  nav_services: { mr: "सेवा", hi: "सेवाएँ", en: "Services" },
  nav_benefits: { mr: "फायदे", hi: "लाभ", en: "Benefits" },
  nav_documents: { mr: "कागदपत्रे", hi: "दस्तावेज़", en: "Documents" },
  nav_track: { mr: "स्थिती तपासा", hi: "स्थिति देखें", en: "Track" },
  nav_faq: { mr: "प्रश्नोत्तरे", hi: "प्रश्नोत्तर", en: "FAQ" },
  nav_about: { mr: "आमच्याबद्दल", hi: "हमारे बारे में", en: "About" },
  nav_contact: { mr: "संपर्क", hi: "संपर्क", en: "Contact" },
  quick_links: { mr: "द्रुत दुवे", hi: "त्वरित लिंक", en: "Quick Links" },
  nav_dashboard: { mr: "माझे अर्ज", hi: "मेरे आवेदन", en: "My applications" },
  nav_admin: { mr: "अॅडमिन", hi: "एडमिन", en: "Admin" },

  hero_eyebrow: { mr: "भालेगाव • मेहकर • बुलढाणा", hi: "भालेगाव • मेहकर • बुलढाणा", en: "Bhalegaon • Mehkar • Buldhana" },
  hero_title: { mr: "गावापासून सरकारी सेवांपर्यंत — एका छताखाली", hi: "गाँव से सरकारी सेवाओं तक — एक ही जगह", en: "From your village to every service — under one roof" },
  hero_sub: {
    mr: "सरकारी कागदपत्रे, शेती योजना आणि ऑनलाइन सेवा. सोप्या भाषेत, स्थानिक मदतीसह.",
    hi: "सरकारी दस्तावेज़, कृषि योजनाएँ और ऑनलाइन सेवाएँ. आसान भाषा में, स्थानीय सहायता के साथ.",
    en: "Government documents, farming schemes and online utilities — explained simply, supported locally.",
  },
  cta_apply: { mr: "सेवा पहा", hi: "सेवाएँ देखें", en: "Browse Services" },
  cta_contact: { mr: "संपर्क करा", hi: "संपर्क करें", en: "Contact Us" },
  cta_track: { mr: "अर्ज तपासा", hi: "आवेदन देखें", en: "Track Application" },

  trust_1: { mr: "१०००+ समाधानी कुटुंबे", hi: "१०००+ संतुष्ट परिवार", en: "1000+ happy families" },
  trust_2: { mr: "५०+ सेवा", hi: "५०+ सेवाएँ", en: "50+ services" },
  trust_3: { mr: "३ भाषा", hi: "३ भाषाएँ", en: "3 languages" },

  services_title: { mr: "आमच्या सेवा", hi: "हमारी सेवाएँ", en: "Our Services" },
  services_sub: { mr: "तुम्हाला हवी ती सेवा निवडा", hi: "अपनी पसंद की सेवा चुनें", en: "Pick the service you need" },
  cat_gov: { mr: "सरकारी सेवा", hi: "सरकारी सेवाएँ", en: "Government" },
  cat_farm: { mr: "शेती सेवा", hi: "कृषि सेवाएँ", en: "Farming" },
  cat_online: { mr: "ऑनलाइन सेवा", hi: "ऑनलाइन सेवाएँ", en: "Online Utilities" },

  required_docs: { mr: "आवश्यक कागदपत्रे", hi: "आवश्यक दस्तावेज़", en: "Required Documents" },
  apply_now: { mr: "अधिक माहिती", hi: "अधिक जानकारी", en: "View Details" },
  view_all: { mr: "सर्व पहा", hi: "सभी देखें", en: "View all" },
  back: { mr: "मागे", hi: "वापस", en: "Back" },

  benefits_title: { mr: "दयावान का निवडावे?", hi: "दयावान क्यों चुनें?", en: "Why Choose Dayawan?" },
  benefits_sub: { mr: "साधेपणा, विश्वास, स्थानिक मदत", hi: "सरलता, विश्वास, स्थानीय सहायता", en: "Simple, trusted, local" },
  benefit_trust_t: { mr: "विश्वासार्ह सेवा", hi: "विश्वसनीय सेवा", en: "Trusted service" },
  benefit_trust_d: { mr: "वर्षानुवर्षे स्थानिक लोकांची मदत", hi: "वर्षों से स्थानीय लोगों की मदद", en: "Years of helping local families" },
  benefit_fast_t: { mr: "जलद प्रक्रिया", hi: "तेज़ प्रक्रिया", en: "Fast processing" },
  benefit_fast_d: { mr: "वेळेत अर्ज पूर्ण", hi: "समय पर आवेदन पूरा", en: "Applications completed on time" },
  benefit_guide_t: { mr: "संपूर्ण मार्गदर्शन", hi: "पूरा मार्गदर्शन", en: "Full guidance" },
  benefit_guide_d: { mr: "सुरुवातीपासून शेवटपर्यंत मदत", hi: "शुरू से अंत तक सहायता", en: "Help from start to finish" },
  benefit_local_t: { mr: "स्थानिक भाषेत मदत", hi: "स्थानीय भाषा में मदद", en: "Local language" },
  benefit_local_d: { mr: "मराठी, हिंदी, इंग्रजी", hi: "मराठी, हिंदी, अंग्रेज़ी", en: "Marathi, Hindi, English" },

  docs_title: { mr: "कसे काम करते?", hi: "यह कैसे काम करता है?", en: "How it works" },
  docs_sub: { mr: "फक्त तीन सोप्या पायऱ्या", hi: "बस तीन आसान चरण", en: "Just three simple steps" },
  step1_t: { mr: "१. कागदपत्रे जमा करा", hi: "१. दस्तावेज़ इकट्ठा करें", en: "1. Gather documents" },
  step1_d: { mr: "आधार, पॅन, फोटो आणि इतर पुरावे", hi: "आधार, पैन, फोटो और अन्य प्रमाण", en: "Aadhaar, PAN, photo and other proofs" },
  step2_t: { mr: "२. केंद्रात आणा", hi: "२. केंद्र पर लाएँ", en: "2. Visit the center" },
  step2_d: { mr: "आमच्या केंद्रात या किंवा फोनवर बोला", hi: "हमारे केंद्र पर आएँ या फोन पर बात करें", en: "Visit our center or call us" },
  step3_t: { mr: "३. स्थिती तपासा", hi: "३. स्थिति जाँचें", en: "3. Track status" },
  step3_d: { mr: "तुमच्या अर्जाची प्रगती सहज पहा", hi: "अपने आवेदन की प्रगति आसानी से देखें", en: "Easily check your application progress" },

  contact_title: { mr: "संपर्क करा", hi: "संपर्क करें", en: "Get in touch" },
  contact_sub: { mr: "आम्ही तुमच्या मदतीसाठी तयार आहोत", hi: "हम आपकी मदद के लिए तैयार हैं", en: "We are here to help you" },
  contact_phone: { mr: "फोन करा", hi: "कॉल करें", en: "Call us" },
  contact_address: { mr: "पत्ता", hi: "पता", en: "Address" },
  contact_hours: { mr: "वेळ", hi: "समय", en: "Working hours" },
  hours_value: { mr: "सोम-शनि • सकाळी ९ ते सायं ८", hi: "सोम-शनि • सुबह ९ से रात ८", en: "Mon–Sat • 9 AM – 8 PM" },
  address_value: {
    mr: "भालेगाव, ता. मेहकर, जि. बुलढाणा, महाराष्ट्र",
    hi: "भालेगाव, ता. मेहकर, जि. बुलढाणा, महाराष्ट्र",
    en: "Bhalegaon, Tal. Mehkar, Dist. Buldhana, Maharashtra",
  },
  form_name: { mr: "तुमचे नाव", hi: "आपका नाम", en: "Your name" },
  form_phone: { mr: "मोबाईल नंबर", hi: "मोबाइल नंबर", en: "Phone number" },
  form_phone_placeholder: { mr: "१० अंकी मोबाईल नंबर", hi: "10 अंकों का मोबाइल नंबर", en: "10-digit mobile number" },
  form_message: { mr: "संदेश", hi: "संदेश", en: "Message" },
  form_submit: { mr: "पाठवा", hi: "भेजें", en: "Send message" },
  form_success: { mr: "धन्यवाद! आम्ही लवकरच संपर्क करू.", hi: "धन्यवाद! हम जल्द ही संपर्क करेंगे.", en: "Thank you! We will contact you soon." },
  form_error: { mr: "कृपया सर्व माहिती बरोबर भरा", hi: "कृपया सभी जानकारी सही भरें", en: "Please fill all fields correctly" },

  /* Track page */
  track_title: { mr: "अर्जाची स्थिती तपासा", hi: "आवेदन की स्थिति देखें", en: "Track your application" },
  track_sub: { mr: "तुमचा अर्ज क्रमांक टाका", hi: "अपना आवेदन नंबर डालें", en: "Enter your application number" },
  track_label: { mr: "अर्ज क्रमांक", hi: "आवेदन नंबर", en: "Application number" },
  track_btn: { mr: "तपासा", hi: "देखें", en: "Check status" },
  track_empty_t: { mr: "अर्ज सापडला नाही", hi: "आवेदन नहीं मिला", en: "No application found" },
  track_empty_d: {
    mr: "कृपया योग्य क्रमांक टाका किंवा आमच्याशी संपर्क करा.",
    hi: "कृपया सही नंबर डालें या हमसे संपर्क करें.",
    en: "Please enter a valid number or contact us for help.",
  },
  track_demo_hint: { mr: "उदाहरण: DYW-1024", hi: "उदाहरण: DYW-1024", en: "Example: DYW-1024" },
  track_found: { mr: "अर्ज सापडला", hi: "आवेदन मिला", en: "Application found" },
  status_submitted: { mr: "सादर केले", hi: "जमा किया", en: "Submitted" },
  status_received: { mr: "प्राप्त झाले", hi: "प्राप्त हुआ", en: "Received" },
  status_processing: { mr: "प्रक्रिया सुरू", hi: "प्रक्रिया जारी", en: "Processing" },
  status_ready: { mr: "तयार आहे", hi: "तैयार है", en: "Ready" },
  status_completed: { mr: "पूर्ण झाले", hi: "पूरा हुआ", en: "Completed" },

  apply_title: { mr: "सेवेसाठी अर्ज करा", hi: "सेवा के लिए आवेदन करें", en: "Apply for this service" },
  apply_sub: {
    mr: "तुमचा अर्ज नोंदवला जाईल आणि ट्रॅकिंग क्रमांक मिळेल.",
    hi: "आपका आवेदन दर्ज होगा और ट्रैकिंग नंबर मिलेगा.",
    en: "Your request will be registered and a tracking code will be generated.",
  },
  apply_btn: { mr: "अर्ज सबमिट करा", hi: "आवेदन जमा करें", en: "Submit application" },
  apply_success: { mr: "अर्ज नोंदवला! ट्रॅकिंग क्रमांक:", hi: "आवेदन दर्ज हुआ! ट्रैकिंग नंबर:", en: "Application submitted! Tracking code:" },
  apply_err_required: { mr: "कृपया नाव आणि मोबाईल भरा", hi: "कृपया नाम और मोबाइल भरें", en: "Please enter name and mobile number" },
  apply_err_phone: { mr: "कृपया १० अंकी मोबाईल नंबर टाका", hi: "कृपया 10 अंकों का मोबाइल नंबर डालें", en: "Please enter a valid 10-digit mobile number" },
  apply_err_submit: {
    mr: "अर्ज सबमिट करता आला नाही. कृपया पुन्हा प्रयत्न करा.",
    hi: "आवेदन जमा नहीं हो सका। कृपया फिर से प्रयास करें।",
    en: "Could not submit your application. Please try again.",
  },

  dashboard_title: { mr: "माझ्या अर्जांची स्थिती", hi: "मेरे आवेदन की स्थिति", en: "My application status" },
  dashboard_sub: { mr: "तुम्ही सबमिट केलेले अर्ज येथे दिसतील.", hi: "आपके जमा आवेदन यहाँ दिखेंगे.", en: "All applications submitted by you appear here." },
  dashboard_empty_title: { mr: "अजून अर्ज नाही", hi: "अभी कोई आवेदन नहीं", en: "No applications yet" },
  dashboard_empty_sub: {
    mr: "सेवा निवडा आणि पहिला अर्ज सबमिट करा.",
    hi: "सेवा चुनें और पहला आवेदन जमा करें.",
    en: "Choose a service and submit your first application.",
  },
  dashboard_name: { mr: "नाव", hi: "नाम", en: "Name" },
  dashboard_service: { mr: "सेवा", hi: "सेवा", en: "Service" },
  dashboard_phone: { mr: "मोबाईल", hi: "मोबाइल", en: "Phone" },
  dashboard_updated: { mr: "शेवटचे अपडेट", hi: "अंतिम अपडेट", en: "Last updated" },

  admin_title: { mr: "अर्ज व्यवस्थापन", hi: "आवेदन प्रबंधन", en: "Application management" },
  admin_sub: { mr: "सर्व अर्जांची स्थिती अपडेट करा.", hi: "सभी आवेदनों की स्थिति अपडेट करें.", en: "Review all applications and update lifecycle status." },
  admin_user: { mr: "अर्जदार", hi: "आवेदक", en: "Applicant" },
  admin_current_status: { mr: "सध्याची स्थिती", hi: "वर्तमान स्थिति", en: "Current status" },
  admin_update_status: { mr: "स्थिती अपडेट करा", hi: "स्थिति अपडेट करें", en: "Update status" },
  admin_status_updated: { mr: "स्थिती अपडेट झाली", hi: "स्थिति अपडेट हुई", en: "Status updated" },
  admin_status_update_failed: {
    mr: "स्थिती अपडेट करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
    hi: "स्थिति अपडेट नहीं हो सकी। कृपया फिर से प्रयास करें।",
    en: "Could not update status. Please try again.",
  },

  /* FAQ */
  faq_title: { mr: "वारंवार विचारले जाणारे प्रश्न", hi: "अक्सर पूछे जाने वाले प्रश्न", en: "Frequently Asked Questions" },
  faq_sub: { mr: "तुमच्या शंकांचे सोपे उत्तर", hi: "आपके सवालों के आसान जवाब", en: "Simple answers to common questions" },

  /* About */
  about_title: { mr: "आमच्याबद्दल", hi: "हमारे बारे में", en: "About Dayawan" },
  about_lead: {
    mr: "दयावान मल्टीसर्व्हिसेस हे ग्रामीण भागातील लोकांसाठी बनवलेले विश्वासू सेवा केंद्र आहे.",
    hi: "दयावान मल्टीसर्विसेस ग्रामीण क्षेत्र के लोगों के लिए बनाया गया भरोसेमंद सेवा केंद्र है.",
    en: "Dayawan Multiservices is a trusted local center built for rural families.",
  },
  about_mission_t: { mr: "आमचे ध्येय", hi: "हमारा लक्ष्य", en: "Our mission" },
  about_mission_d: {
    mr: "प्रत्येक गावकऱ्याला सरकारी, शेती व ऑनलाइन सेवा सोप्या मराठीत मिळाव्यात.",
    hi: "हर ग्रामीण को सरकारी, कृषि और ऑनलाइन सेवाएँ आसान भाषा में मिलें.",
    en: "Make government, farming and online services accessible in plain language to every villager.",
  },
  about_vision_t: { mr: "आमची दृष्टी", hi: "हमारा विज़न", en: "Our vision" },
  about_vision_d: {
    mr: "तंत्रज्ञानामुळे कोणीही मागे राहू नये — सर्वांसाठी डिजिटल भारत.",
    hi: "तकनीक के कारण कोई पीछे न रहे — सबके लिए डिजिटल भारत.",
    en: "No one left behind by technology — a digital India for everyone.",
  },

  footer_rights: { mr: "सर्व हक्क राखीव", hi: "सर्वाधिकार सुरक्षित", en: "All rights reserved" },
  footer_made: { mr: "ग्रामीण महाराष्ट्रासाठी ❤️ ने बनवले", hi: "ग्रामीण महाराष्ट्र के लिए ❤️ से बनाया", en: "Made with ❤️ for rural Maharashtra" },
  not_found_title: { mr: "पृष्ठ सापडले नाही", hi: "पेज नहीं मिला", en: "Page not found" },
  not_found_home: { mr: "मुख्यपृष्ठावर परत जा", hi: "होम पर वापस जाएँ", en: "Back to home" },

  /* Auth — Login & Register */
  nav_login: { mr: "लॉग इन", hi: "लॉग इन", en: "Log in" },
  nav_register: { mr: "नोंदणी करा", hi: "रजिस्टर करें", en: "Register" },
  nav_account: { mr: "खाते", hi: "खाता", en: "Account" },
  nav_logout: { mr: "बाहेर पडा", hi: "लॉग आउट", en: "Log out" },

  login_title: { mr: "आपल्या खात्यात प्रवेश करा", hi: "अपने खाते में लॉग इन करें", en: "Sign in to your account" },
  login_sub: { mr: "खाते नाही? नोंदणी करा", hi: "खाता नहीं है? रजिस्टर करें", en: "No account? Register" },
  login_email: { mr: "ईमेल पत्ता", hi: "ईमेल पता", en: "Email address" },
  login_password: { mr: "पासवर्ड", hi: "पासवर्ड", en: "Password" },
  login_btn: { mr: "लॉग इन करा", hi: "लॉग इन करें", en: "Sign in" },
  login_success: { mr: "स्वागत आहे!", hi: "स्वागत है!", en: "Welcome back!" },
  login_err_credentials: { mr: "चुकीचा ईमेल किंवा पासवर्ड", hi: "गलत ईमेल या पासवर्ड", en: "Invalid email or password" },
  login_err_generic: { mr: "काहीतरी चुकले. पुन्हा प्रयत्न करा.", hi: "कुछ गलत हुआ। पुनः प्रयास करें।", en: "Something went wrong. Please try again." },

  register_title: { mr: "नवीन खाते तयार करा", hi: "नया खाता बनाएँ", en: "Create your account" },
  register_sub: { mr: "आधीच खाते आहे? लॉग इन करा", hi: "पहले से खाता है? लॉग इन करें", en: "Already have an account? Log in" },
  register_name: { mr: "पूर्ण नाव", hi: "पूरा नाम", en: "Full name" },
  register_email: { mr: "ईमेल पत्ता", hi: "ईमेल पता", en: "Email address" },
  register_password: { mr: "पासवर्ड", hi: "पासवर्ड", en: "Password" },
  register_confirm: { mr: "पासवर्ड पुष्टी करा", hi: "पासवर्ड की पुष्टि करें", en: "Confirm password" },
  register_btn: { mr: "नोंदणी करा", hi: "रजिस्टर करें", en: "Create account" },
  register_success: { mr: "खाते तयार झाले! कृपया ईमेल तपासा.", hi: "खाता बनाया गया! कृपया ईमेल जाँचें।", en: "Account created! Please check your email to verify." },
  register_err_match: { mr: "पासवर्ड जुळत नाहीत", hi: "पासवर्ड मेल नहीं खाते", en: "Passwords do not match" },
  register_err_generic: { mr: "नोंदणी अयशस्वी. पुन्हा प्रयत्न करा.", hi: "रजिस्ट्रेशन विफल। पुनः प्रयास करें।", en: "Registration failed. Please try again." },

  auth_not_configured_title: { mr: "सेवा उपलब्ध नाही", hi: "सेवा उपलब्ध नहीं", en: "Service not available" },
  auth_not_configured_body: {
    mr: "लॉगिन / नोंदणी सेवा अद्याप जोडलेली नाही. लवकरच उपलब्ध होईल.",
    hi: "लॉगिन / रजिस्ट्रेशन सेवा अभी तक जुड़ी नहीं है। जल्द उपलब्ध होगी।",
    en: "The login / registration service has not been connected yet. Please check back soon.",
  },
};

export type ServiceItem = {
  id: string;
  category: "gov" | "farm" | "online";
  title: { mr: string; hi: string; en: string };
  desc: { mr: string; hi: string; en: string };
  long?: { mr: string; hi: string; en: string };
  docs: { mr: string; hi: string; en: string }[];
  fee?: { mr: string; hi: string; en: string };
  time?: { mr: string; hi: string; en: string };
};

export const SERVICES: ServiceItem[] = [
  {
    id: "aadhaar",
    category: "gov",
    title: { mr: "आधार कार्ड सेवा", hi: "आधार कार्ड सेवा", en: "Aadhaar Card Service" },
    desc: { mr: "नवीन आधार, अपडेट, दुरुस्ती", hi: "नया आधार, अपडेट, सुधार", en: "New Aadhaar, update, correction" },
    long: {
      mr: "नवीन आधार नोंदणी, नाव/पत्ता/जन्मतारीख दुरुस्ती, मोबाईल अपडेट — सर्व सुविधा एका ठिकाणी.",
      hi: "नया आधार पंजीकरण, नाम/पता/जन्मतिथि सुधार, मोबाइल अपडेट — सब एक जगह.",
      en: "New Aadhaar enrolment, name/address/DOB correction and mobile update — all in one place.",
    },
    docs: [
      { mr: "ओळखपत्र", hi: "पहचान पत्र", en: "ID proof" },
      { mr: "पत्ता पुरावा", hi: "पता प्रमाण", en: "Address proof" },
      { mr: "फोटो", hi: "फोटो", en: "Photo" },
    ],
    fee: { mr: "₹५० पासून", hi: "₹५० से", en: "From ₹50" },
    time: { mr: "१५-२० मिनिटे", hi: "१५-२० मिनट", en: "15–20 minutes" },
  },
  {
    id: "pan",
    category: "gov",
    title: { mr: "पॅन कार्ड", hi: "पैन कार्ड", en: "PAN Card" },
    desc: { mr: "नवीन पॅन कार्ड व दुरुस्ती", hi: "नया पैन कार्ड व सुधार", en: "New PAN card and corrections" },
    long: {
      mr: "नवीन पॅन कार्ड अर्ज, दुरुस्ती व पुनर्मुद्रण — कमी वेळेत.",
      hi: "नया पैन आवेदन, सुधार और पुनर्मुद्रण — कम समय में.",
      en: "New PAN application, corrections and re-print — quickly.",
    },
    docs: [
      { mr: "आधार कार्ड", hi: "आधार कार्ड", en: "Aadhaar card" },
      { mr: "जन्म दाखला", hi: "जन्म प्रमाणपत्र", en: "Birth certificate" },
    ],
    fee: { mr: "₹१०७ पासून", hi: "₹१०७ से", en: "From ₹107" },
    time: { mr: "१०-१५ दिवस", hi: "१०-१५ दिन", en: "10–15 days" },
  },
  {
    id: "rationcard",
    category: "gov",
    title: { mr: "रेशन कार्ड", hi: "राशन कार्ड", en: "Ration Card" },
    desc: { mr: "नवीन रेशन कार्ड, नाव जोडणे", hi: "नया राशन कार्ड, नाम जोड़ना", en: "New ration card, add member" },
    docs: [
      { mr: "आधार कार्ड", hi: "आधार कार्ड", en: "Aadhaar card" },
      { mr: "उत्पन्न दाखला", hi: "आय प्रमाणपत्र", en: "Income certificate" },
    ],
    fee: { mr: "नाममात्र शुल्क", hi: "नाममात्र शुल्क", en: "Nominal fee" },
    time: { mr: "१५-३० दिवस", hi: "१५-३० दिन", en: "15–30 days" },
  },
  {
    id: "pmkisan",
    category: "farm",
    title: { mr: "पीएम किसान योजना", hi: "पीएम किसान योजना", en: "PM Kisan Yojana" },
    desc: { mr: "शेतकऱ्यांना ₹६००० वार्षिक मदत", hi: "किसानों को ₹६००० वार्षिक सहायता", en: "₹6000/year support for farmers" },
    docs: [
      { mr: "आधार कार्ड", hi: "आधार कार्ड", en: "Aadhaar card" },
      { mr: "७/१२ उतारा", hi: "७/१२ उतारा", en: "7/12 land record" },
      { mr: "बँक पासबुक", hi: "बैंक पासबुक", en: "Bank passbook" },
    ],
    fee: { mr: "मोफत नोंदणी", hi: "मुफ्त पंजीकरण", en: "Free enrolment" },
    time: { mr: "२० मिनिटे", hi: "२० मिनट", en: "20 minutes" },
  },
  {
    id: "cropinsurance",
    category: "farm",
    title: { mr: "पीक विमा", hi: "फसल बीमा", en: "Crop Insurance" },
    desc: { mr: "नैसर्गिक आपत्तीपासून संरक्षण", hi: "प्राकृतिक आपदा से सुरक्षा", en: "Protection from natural calamities" },
    docs: [
      { mr: "७/१२ उतारा", hi: "७/१२ उतारा", en: "7/12 record" },
      { mr: "आधार कार्ड", hi: "आधार कार्ड", en: "Aadhaar card" },
    ],
  },
  {
    id: "soilcard",
    category: "farm",
    title: { mr: "मृदा आरोग्य कार्ड", hi: "मृदा स्वास्थ्य कार्ड", en: "Soil Health Card" },
    desc: { mr: "जमिनीची तपासणी व सल्ला", hi: "मिट्टी की जाँच व सलाह", en: "Soil testing and advice" },
    docs: [{ mr: "७/१२ उतारा", hi: "७/१२ उतारा", en: "7/12 record" }],
  },
  {
    id: "bill",
    category: "online",
    title: { mr: "वीज / पाणी बिल भरणे", hi: "बिजली / पानी बिल भुगतान", en: "Electricity / Water Bill" },
    desc: { mr: "सर्व बिले एका ठिकाणी भरा", hi: "सभी बिल एक जगह भरें", en: "Pay all bills at one place" },
    docs: [{ mr: "बिलाची प्रत", hi: "बिल की कॉपी", en: "Bill copy" }],
  },
  {
    id: "recharge",
    category: "online",
    title: { mr: "मोबाईल रिचार्ज / DTH", hi: "मोबाइल रिचार्ज / DTH", en: "Mobile Recharge / DTH" },
    desc: { mr: "सर्व नेटवर्क व DTH रिचार्ज", hi: "सभी नेटवर्क व DTH रिचार्ज", en: "All networks and DTH" },
    docs: [{ mr: "मोबाईल नंबर", hi: "मोबाइल नंबर", en: "Mobile number" }],
  },
  {
    id: "print",
    category: "online",
    title: { mr: "प्रिंट / झेरॉक्स / स्कॅन", hi: "प्रिंट / फोटोकॉपी / स्कैन", en: "Print / Xerox / Scan" },
    desc: { mr: "कमी दरात दस्तऐवज सेवा", hi: "कम दर पर दस्तावेज़ सेवा", en: "Affordable document services" },
    docs: [{ mr: "मूळ कागदपत्र", hi: "मूल दस्तावेज़", en: "Original document" }],
  },
];

export const FAQS: { q: { mr: string; hi: string; en: string }; a: { mr: string; hi: string; en: string } }[] = [
  {
    q: { mr: "तुमचे केंद्र कुठे आहे?", hi: "आपका केंद्र कहाँ है?", en: "Where is your center located?" },
    a: {
      mr: "भालेगाव, ता. मेहकर, जि. बुलढाणा येथे आमचे केंद्र आहे. नकाशा संपर्क पानावर पहा.",
      hi: "भालेगाव, ता. मेहकर, जि. बुलढाणा में हमारा केंद्र है. नक्शा संपर्क पेज पर देखें.",
      en: "Bhalegaon, Tal. Mehkar, Dist. Buldhana. See the map on the Contact page.",
    },
  },
  {
    q: { mr: "अर्जासाठी किती वेळ लागतो?", hi: "आवेदन में कितना समय लगता है?", en: "How long does an application take?" },
    a: {
      mr: "सेवेनुसार वेळ बदलतो. प्रत्येक सेवेच्या पानावर अंदाजे वेळ दिलेला आहे.",
      hi: "सेवा के अनुसार समय अलग होता है. हर सेवा पेज पर अनुमानित समय दिया गया है.",
      en: "It varies by service. Estimated time is shown on each service page.",
    },
  },
  {
    q: { mr: "शुल्क किती आहे?", hi: "शुल्क कितना है?", en: "What are the charges?" },
    a: {
      mr: "सरकारी शुल्क + किरकोळ सेवा शुल्क. सर्व शुल्क आधीच सांगितले जातात.",
      hi: "सरकारी शुल्क + मामूली सेवा शुल्क. सभी शुल्क पहले बताए जाते हैं.",
      en: "Government fee plus a small service charge. All fees are disclosed up front.",
    },
  },
  {
    q: { mr: "कोणत्या भाषेत मदत मिळेल?", hi: "किस भाषा में सहायता मिलेगी?", en: "Which languages do you support?" },
    a: {
      mr: "मराठी, हिंदी आणि इंग्रजी — तिन्ही भाषेत मदत.",
      hi: "मराठी, हिंदी और अंग्रेज़ी — तीनों भाषाओं में सहायता.",
      en: "Marathi, Hindi and English.",
    },
  },
  {
    q: { mr: "मी कागदपत्रे फोनवर पाठवू शकतो का?", hi: "क्या मैं दस्तावेज़ फोन से भेज सकता हूँ?", en: "Can I share documents over phone?" },
    a: {
      mr: "होय, WhatsApp वर पाठवू शकता. मात्र काही सेवांसाठी मूळ कागदपत्रे लागतात.",
      hi: "हाँ, WhatsApp पर भेज सकते हैं. कुछ सेवाओं के लिए मूल दस्तावेज़ ज़रूरी हैं.",
      en: "Yes, you can share over WhatsApp. Some services need original documents.",
    },
  },
];
