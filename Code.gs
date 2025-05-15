function doGet(e) {
  const token = e.parameter.token;
  if (token) {
    return HtmlService.createHtmlOutputFromFile('reset')
      .setTitle('Đặt lại mật khẩu')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
  }

  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Hệ thống ERP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}



function handleLogin(data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("user");
  const users = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // [name, email, hashedPassword]

  const hashedInput = hashPassword(data.password);

  for (let [name, email, hashedPassword] of users) {
    if (email === data.email && hashedPassword === hashedInput) {
      return `Đăng nhập thành công cho ${name}`;
    }
  }

  return "Email hoặc mật khẩu không đúng.";
}

function handleRegister(data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("user");
  const existingEmails = sheet.getRange(2, 2, sheet.getLastRow() - 1).getValues().flat();

  if (existingEmails.includes(data.email)) {
    return "Email đã được đăng ký.";
  }

  const hashedPassword = hashPassword(data.password);
  sheet.appendRow([data.name, data.email, hashedPassword]);
  return "Đăng ký thành công!";
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return rawHash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function handleForgotPassword(data) {
  const sheet = SpreadsheetApp.getActive().getSheetByName("user");
  const users = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues(); // [name, email, hashedPassword, token, expiresAt]

  const userIndex = users.findIndex(row => row[1] === data.email);

  if (userIndex === -1) {
    return "Không tìm thấy tài khoản với email này.";
  }

  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
  sheet.getRange(userIndex + 2, 4).setValue(token); // Cột D
  sheet.getRange(userIndex + 2, 5).setValue(expiresAt); // Cột E

  const scriptUrl = ScriptApp.getService().getUrl();
  const resetLink = `${scriptUrl}?token=${token}`;

  const subject = "Yêu cầu đặt lại mật khẩu - Hệ thống ERP";
  const body = `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào liên kết dưới đây trong vòng 15 phút:\n\n${resetLink}`;

  MailApp.sendEmail(data.email, subject, body);

  return "Liên kết đặt lại mật khẩu đã được gửi đến email.";
}

function generateToken(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
