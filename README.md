# מדריך למשתמש - Affiliate Link Hub

מערכת לניהול ושיתוף קישורים עם אינטגרציה של שותפים (Affiliate) וממשק ניהול מתקדם.

## 🚀 הגדרה ראשונית (Setup)

כדי שהאפליקציה תעבוד בצורה מלאה, יש להגדיר את המשתנים הבאים בלוח ה-**Secrets** ב-AI Studio:

1. **Firebase Configuration**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`

### מבנה הנתונים ב-Firestore:
יש ליצור את האוספים (Collections) הבאים:

- **categories**:
  - `name_he` (string)
  - `name_en` (string)
  - `slug` (string)
  - `order` (number)
  - `isActive` (boolean)

- **links**:
  - `title_he` (string)
  - `title_en` (string)
  - `description_he` (string)
  - `description_en` (string)
  - `targetUrl` (string)
  - `categoryId` (string - ID של קטגוריה)
  - `createdAt` (timestamp)
  - `isActive` (boolean)
  - `clicks` (number)

- **users**:
  - מסמך עם ה-UID של המנהל (מ-Firebase Auth)
  - שדה `role` עם הערך `"admin"`

---

## 👥 חווית המשתמש (Visitor)

1. **דף הבית**: המשתמש רואה רשת של כרטיסי קישורים עם אפשרות לסינון לפי קטגוריות וחיפוש חופשי.
2. **מנגנון ההפניה (Redirect)**:
   - לחיצה על קישור מעבירה לדף ביניים.
   - דף הביניים מפעיל ברקע את קישור ה-Affiliate של AliExpress.
   - לאחר השהיה של כ-650ms, המשתמש מועבר אוטומטית ליעד הסופי.
   - המערכת סופרת את ההקלקה ב-Firestore ומדווחת ל-Firebase Analytics.

---

## 🔐 מערכת הניהול (Admin)

מערכת הניהול מוסתרת כדי לשמור על עיצוב נקי ואבטחה.

### דרכי גישה:
1. **קישור ישיר**: ניתן לגשת לכתובת `[URL]/internal-portal-8472`.
2. **טריגר סודי**: 5 לחיצות מהירות על הטקסט ב-Footer (זכויות יוצרים) יפתחו את דף ההתחברות.
3. **קיצור מקלדת**: לחיצה על `Ctrl + Shift + A`.

### התחברות:
- יש להשתמש באימייל וסיסמה שהוגדרו ב-Firebase Auth.
- המערכת בודקת שהמשתמש מוגדר כ-`admin` באוסף ה-`users` ב-Firestore.

### יכולות בלוח הבקרה:
- צפייה בכל הקישורים והקטגוריות (כולל לא פעילים).
- מעקב אחרי כמות הקליקים לכל קישור.
- יצירה, עריכה ומחיקה של תוכן (ממשק בסיסי מוכן, ניתן להרחבה).

---

## 🛠 פרטים טכניים
- **שפות**: תמיכה מלאה בעברית (RTL) ואנגלית (LTR).
- **טכנולוגיה**: React 19, TypeScript, Tailwind CSS 4, Zustand, Firebase.
- **ביצועים**: שימוש ב-Code Splitting וטעינה עצלה (Lazy Loading) לשיפור מהירות הטעינה.
- **עיצוב**: נקי, מודרני, מבוסס על כרטיסים עם אנימציות עדינות (Motion).
