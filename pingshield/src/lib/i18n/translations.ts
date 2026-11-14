const translations = {
  en: {
    // App
    'app.name': 'PingShield',
    'app.tagline': 'Lost & Found · Emergency Contact',
    'app.description': 'PingShield helps finders contact the owner of a tagged belonging without exposing personal phone numbers.',

    // Finder page
    'finder.title': 'You found something!',
    'finder.subtitle': 'This item is registered with PingShield. You can help return it to its owner.',
    'finder.ownerMessage': "Owner's message",
    'finder.category': 'Item type',
    'finder.locationShare.title': 'Share your location',
    'finder.locationShare.question': 'Would you like to share your current location with this item\'s owner?',
    'finder.locationShare.explanation': 'Your location will be shared only with the registered owner of this item to help them recover it. It will not be shared with anyone else.',
    'finder.locationShare.yes': 'Share my location',
    'finder.locationShare.no': 'No, thanks',
    'finder.locationShare.success': 'Location shared successfully!',
    'finder.locationShare.denied': 'Location access denied. You can still use all contact options below.',
    'finder.locationShare.manual': 'Or describe a landmark / drop a pin',
    'finder.locationShare.manualLabel': 'Manually provided location',

    'finder.contact.title': 'Contact the owner',
    'finder.contact.call': 'Call owner (private)',
    'finder.contact.callDesc': 'Your number stays private. The call goes through our relay service.',
    'finder.contact.message': 'Send a message',
    'finder.contact.messageDesc': 'Send a private message to the owner through PingShield.',
    'finder.contact.messagePlaceholder': 'Describe where you found the item...',
    'finder.contact.send': 'Send message',
    'finder.contact.phoneRequired': 'To make a private call, we need your phone number.',
    'finder.contact.phoneExplain': 'Your number is used only to connect this call and will not be shared with the owner.',
    'finder.contact.phonePlaceholder': '+91 XXXXX XXXXX',

    'finder.emergency.title': 'Emergency options',
    'finder.emergency.subtitle': 'If the owner might need urgent help',
    'finder.emergency.callOwner': 'Try calling owner',
    'finder.emergency.callFamily': 'Call emergency contact',
    'finder.emergency.familyLocked': 'Complete {count} unanswered owner calls to unlock',
    'finder.emergency.familyUnlocked': 'Emergency contact available',
    'finder.emergency.attemptCount': '{count} of {required} owner call attempts completed',
    'finder.emergency.112': 'Call 112 — Emergency',
    'finder.emergency.1033': 'Call 1033 — Highway Assistance',
    'finder.emergency.publicCallNote': 'Public emergency calls use your phone directly. Your number is not hidden for emergency services.',

    'finder.report.title': 'Report abuse',
    'finder.report.button': 'Report this tag',
    'finder.report.reason': 'Reason for report',
    'finder.report.submit': 'Submit report',
    'finder.report.success': 'Report submitted. Thank you.',

    'finder.privacy.title': 'Your privacy',
    'finder.privacy.info': 'PingShield protects both your privacy and the owner\'s. Personal phone numbers are never shared between parties. Messages go through our platform. We do not track you or require an account.',

    'finder.invalid.title': 'Invalid or revoked tag',
    'finder.invalid.message': 'This QR code is no longer active or was never registered. If you believe this is an error, please contact support.',

    // Emergency standalone page
    'emergency.title': 'Emergency Assistance',
    'emergency.subtitle': 'Get help quickly. No account or tag scan needed.',
    'emergency.location.title': 'Your location',
    'emergency.location.share': 'Share location',
    'emergency.location.copy': 'Copy coordinates',
    'emergency.location.copied': 'Copied!',
    'emergency.location.unavailable': 'Location not available',
    'emergency.location.summary': 'Near {address}',
    'emergency.call112': 'Call 112 — Emergency Services',
    'emergency.call112Desc': 'Police, Fire, Ambulance',
    'emergency.call1033': 'Call 1033 — Highway Help',
    'emergency.call1033Desc': 'National Highway Authority assistance',
    'emergency.note': 'These are direct calls to public services. Your phone number will be visible to the service.',
    'emergency.devWarning': 'DEVELOPMENT MODE: Tapping will show the number but not actually dial. In production, these connect to real emergency services.',

    // Auth
    'auth.login': 'Sign in',
    'auth.register': 'Create account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full name',
    'auth.phone': 'Phone number',
    'auth.logout': 'Sign out',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.items': 'My Items',
    'dashboard.addItem': 'Add Item',
    'dashboard.noItems': 'No items registered yet. Add your first item to get started.',
    'dashboard.contacts': 'Emergency Contacts',
    'dashboard.addContact': 'Add Contact',
    'dashboard.notifications': 'Notifications',
    'dashboard.noNotifications': 'No notifications yet.',
    'dashboard.incidents': 'Incidents',
    'dashboard.settings': 'Settings',
    'dashboard.reports': 'Location Reports',

    // Items
    'item.name': 'Item name',
    'item.category': 'Category',
    'item.description': 'Description (private)',
    'item.publicMessage': 'Public message (shown to finders)',
    'item.color': 'Color',
    'item.save': 'Save',
    'item.delete': 'Delete item',
    'item.tags': 'QR Tags',
    'item.generateTag': 'Generate QR Tag',
    'item.downloadQR': 'Download QR Code',
    'item.printQR': 'Print QR Tag',
    'item.revokeTag': 'Revoke this tag',
    'item.markStolen': 'Mark as stolen',
    'item.unmarkStolen': 'Unmark stolen',
    'item.categories.bag': 'Bag',
    'item.categories.phone': 'Phone',
    'item.categories.laptop': 'Laptop',
    'item.categories.keys': 'Keys',
    'item.categories.vehicle': 'Vehicle',
    'item.categories.wallet': 'Wallet',
    'item.categories.other': 'Other',

    // Contacts
    'contact.name': 'Contact name',
    'contact.phone': 'Phone number',
    'contact.relationship': 'Relationship',
    'contact.invitationLink': 'Invitation link',
    'contact.invitationNote': 'Share this link with your contact. They must accept to receive emergency calls.',
    'contact.status.pending': 'Pending acceptance',
    'contact.status.accepted': 'Accepted',
    'contact.status.withdrawn': 'Consent withdrawn',
    'contact.consent.title': 'Emergency Contact Invitation',
    'contact.consent.explanation': 'You have been invited to be an emergency contact. If the owner\'s belongings are found and they cannot be reached, you may receive a call from PingShield.',
    'contact.consent.accept': 'Accept',
    'contact.consent.decline': 'Decline',
    'contact.consent.withdraw': 'Withdraw consent',
    'contact.consent.report': 'Report misuse',

    // Incident
    'incident.status.reported': 'Reported',
    'incident.status.contacting_owner': 'Contacting Owner',
    'incident.status.owner_acknowledged': 'Owner Acknowledged',
    'incident.status.family_contact_enabled': 'Family Contact Enabled',
    'incident.status.family_acknowledged': 'Family Acknowledged',
    'incident.status.resolved': 'Resolved',
    'incident.acknowledge': 'Acknowledge',
    'incident.resolve': 'Mark Resolved',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try again',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.success': 'Success',
    'common.offline': 'You appear to be offline. Some features may not work.',
    'common.permissionDenied': 'Permission denied',
    'common.empty': 'Nothing here yet',
  },

  hi: {
    'app.name': 'PingShield',
    'app.tagline': 'खोया-पाया · आपातकालीन संपर्क',
    'app.description': 'PingShield खोजकर्ता को व्यक्तिगत फोन नंबर उजागर किए बिना टैग किए गए सामान के मालिक से संपर्क करने में मदद करता है।',

    'finder.title': 'आपको कुछ मिला!',
    'finder.subtitle': 'यह सामान PingShield में पंजीकृत है। आप इसे मालिक को वापस करने में मदद कर सकते हैं।',
    'finder.ownerMessage': 'मालिक का संदेश',
    'finder.category': 'सामान का प्रकार',
    'finder.locationShare.title': 'अपना स्थान साझा करें',
    'finder.locationShare.question': 'क्या आप इस सामान के मालिक के साथ अपना वर्तमान स्थान साझा करना चाहेंगे?',
    'finder.locationShare.explanation': 'आपका स्थान केवल इस सामान के पंजीकृत मालिक के साथ साझा किया जाएगा। किसी और के साथ नहीं।',
    'finder.locationShare.yes': 'मेरा स्थान साझा करें',
    'finder.locationShare.no': 'नहीं, धन्यवाद',
    'finder.locationShare.success': 'स्थान सफलतापूर्वक साझा किया गया!',
    'finder.locationShare.denied': 'स्थान अनुमति अस्वीकृत। आप अभी भी नीचे सभी संपर्क विकल्पों का उपयोग कर सकते हैं।',
    'finder.locationShare.manual': 'या कोई लैंडमार्क बताएं / पिन लगाएं',
    'finder.locationShare.manualLabel': 'मैन्युअल रूप से प्रदान किया गया स्थान',

    'finder.contact.title': 'मालिक से संपर्क करें',
    'finder.contact.call': 'मालिक को कॉल करें (निजी)',
    'finder.contact.callDesc': 'आपका नंबर निजी रहेगा। कॉल हमारी रिले सेवा से होगी।',
    'finder.contact.message': 'संदेश भेजें',
    'finder.contact.messageDesc': 'PingShield के माध्यम से मालिक को निजी संदेश भेजें।',
    'finder.contact.messagePlaceholder': 'बताएं कि आपको सामान कहाँ मिला...',
    'finder.contact.send': 'संदेश भेजें',
    'finder.contact.phoneRequired': 'निजी कॉल करने के लिए, हमें आपका फोन नंबर चाहिए।',
    'finder.contact.phoneExplain': 'आपका नंबर केवल इस कॉल को जोड़ने के लिए उपयोग किया जाएगा और मालिक के साथ साझा नहीं किया जाएगा।',
    'finder.contact.phonePlaceholder': '+91 XXXXX XXXXX',

    'finder.emergency.title': 'आपातकालीन विकल्प',
    'finder.emergency.subtitle': 'अगर मालिक को तत्काल मदद की जरूरत हो',
    'finder.emergency.callOwner': 'मालिक को कॉल करने का प्रयास करें',
    'finder.emergency.callFamily': 'आपातकालीन संपर्क को कॉल करें',
    'finder.emergency.familyLocked': 'अनलॉक करने के लिए {count} अनुत्तरित मालिक कॉल पूरी करें',
    'finder.emergency.familyUnlocked': 'आपातकालीन संपर्क उपलब्ध',
    'finder.emergency.attemptCount': '{required} में से {count} मालिक कॉल प्रयास पूरे',
    'finder.emergency.112': '112 पर कॉल करें — आपातकालीन',
    'finder.emergency.1033': '1033 पर कॉल करें — हाईवे सहायता',
    'finder.emergency.publicCallNote': 'सार्वजनिक आपातकालीन कॉल सीधे आपके फोन से होती हैं। आपका नंबर आपातकालीन सेवाओं से छिपा नहीं होता।',

    'finder.report.title': 'दुरुपयोग की रिपोर्ट करें',
    'finder.report.button': 'इस टैग की रिपोर्ट करें',
    'finder.report.reason': 'रिपोर्ट का कारण',
    'finder.report.submit': 'रिपोर्ट जमा करें',
    'finder.report.success': 'रिपोर्ट जमा हो गई। धन्यवाद।',

    'finder.privacy.title': 'आपकी गोपनीयता',
    'finder.privacy.info': 'PingShield आपकी और मालिक दोनों की गोपनीयता की रक्षा करता है। व्यक्तिगत फोन नंबर कभी साझा नहीं किए जाते। संदेश हमारे प्लेटफॉर्म से जाते हैं। हम आपको ट्रैक नहीं करते या खाता बनाने की आवश्यकता नहीं रखते।',

    'finder.invalid.title': 'अमान्य या निरस्त टैग',
    'finder.invalid.message': 'यह QR कोड अब सक्रिय नहीं है या कभी पंजीकृत नहीं हुआ था।',

    'emergency.title': 'आपातकालीन सहायता',
    'emergency.subtitle': 'जल्दी से मदद प्राप्त करें। कोई खाता या टैग स्कैन आवश्यक नहीं।',
    'emergency.location.title': 'आपका स्थान',
    'emergency.location.share': 'स्थान साझा करें',
    'emergency.location.copy': 'निर्देशांक कॉपी करें',
    'emergency.location.copied': 'कॉपी हो गया!',
    'emergency.location.unavailable': 'स्थान उपलब्ध नहीं',
    'emergency.call112': '112 — आपातकालीन सेवाएं',
    'emergency.call112Desc': 'पुलिस, दमकल, एम्बुलेंस',
    'emergency.call1033': '1033 — हाईवे सहायता',
    'emergency.call1033Desc': 'राष्ट्रीय राजमार्ग प्राधिकरण सहायता',
    'emergency.note': 'ये सार्वजनिक सेवाओं को सीधे कॉल हैं। आपका फोन नंबर सेवा को दिखेगा।',
    'emergency.devWarning': 'विकास मोड: टैप करने पर नंबर दिखेगा लेकिन वास्तव में डायल नहीं होगा।',

    'auth.login': 'साइन इन',
    'auth.register': 'खाता बनाएं',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.phone': 'फोन नंबर',
    'auth.logout': 'साइन आउट',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.hasAccount': 'पहले से खाता है?',

    'dashboard.title': 'डैशबोर्ड',
    'dashboard.items': 'मेरे सामान',
    'dashboard.addItem': 'सामान जोड़ें',
    'dashboard.noItems': 'कोई सामान पंजीकृत नहीं है। शुरू करने के लिए अपना पहला सामान जोड़ें।',
    'dashboard.contacts': 'आपातकालीन संपर्क',
    'dashboard.addContact': 'संपर्क जोड़ें',
    'dashboard.notifications': 'सूचनाएं',
    'dashboard.incidents': 'घटनाएं',
    'dashboard.settings': 'सेटिंग्स',

    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कुछ गलत हो गया',
    'common.retry': 'पुनः प्रयास करें',
    'common.cancel': 'रद्द करें',
    'common.back': 'वापस',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    'common.confirm': 'पुष्टि करें',
    'common.success': 'सफल',
    'common.offline': 'आप ऑफलाइन प्रतीत होते हैं। कुछ सुविधाएं काम नहीं कर सकतीं।',
    'common.empty': 'यहाँ अभी कुछ नहीं है',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

export function t(key: string, lang: Language = 'en', params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.en;
  let value = (dict as any)[key] || (translations.en as any)[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return value;
}

export function getLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
  ];
}

export default translations;
