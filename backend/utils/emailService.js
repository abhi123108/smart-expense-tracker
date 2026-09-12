const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// =====================================================
// CONFIG
// =====================================================

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM;
  const fromName = process.env.MAIL_FROM_NAME || 'ExpenseAI';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!fromEmail) {
    throw new Error('MAIL_FROM is not configured');
  }

  return {
    apiKey,
    fromEmail,
    fromName,
  };
}

// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =====================================================
// SEND EMAIL THROUGH BREVO
// =====================================================

async function sendEmail({
  to,
  subject,
  text,
  html,
}) {
  const {
    apiKey,
    fromEmail,
    fromName,
  } = getBrevoConfig();

  if (!to) {
    throw new Error('Recipient email is required');
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',

      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },

      body: JSON.stringify({
        sender: {
          name: fromName,
          email: fromEmail,
        },

        to: [
          {
            email: to,
          },
        ],

        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Brevo email failed:', {
        status: response.status,
        message: data?.message || 'Unknown Brevo error',
      });

      throw new Error(
        data?.message ||
          `Brevo email request failed with status ${response.status}`
      );
    }

    console.log(
      `Email sent successfully through Brevo to ${to}`
    );

    return data;
  } catch (error) {
    console.error('Brevo email service error:', {
      message: error?.message,
    });

    throw error;
  }
}

// =====================================================
// SEND BUDGET ALERT EMAIL
// =====================================================

async function sendBudgetAlertEmail({
  to,
  name,
  category,
  level,
  percentUsed,
  spent,
  limit,
}) {
  const exceeded = level === 'exceeded';

  const safeName = escapeHtml(name || 'there');
  const safeCategory = escapeHtml(category || 'Overall');

  const budgetAmount = Number(limit || 0);
  const spentAmount = Number(spent || 0);

  const remaining = Math.max(
    budgetAmount - spentAmount,
    0
  );

  const formattedBudget =
    budgetAmount.toLocaleString('en-IN');

  const formattedSpent =
    spentAmount.toLocaleString('en-IN');

  const formattedRemaining =
    remaining.toLocaleString('en-IN');

  const subject = exceeded
    ? `ExpenseAI: ${category} budget exceeded`
    : `ExpenseAI: ${category} budget alert`;

  const dashboardUrl =
    process.env.CLIENT_URL ||
    'http://localhost:5173';

  const text = [
    `Hi ${name || 'there'},`,
    '',
    exceeded
      ? `Your ${category} budget has been exceeded.`
      : `Your ${category} budget has reached ${percentUsed}%.`,
    '',
    `Category: ${category}`,
    `Budget: ₹${formattedBudget}`,
    `Spent: ₹${formattedSpent}`,
    `Remaining: ₹${formattedRemaining}`,
    `Usage: ${percentUsed}%`,
    '',
    'Review your recent expenses in ExpenseAI.',
    '',
    `Open Dashboard: ${dashboardUrl}`,
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>ExpenseAI Budget Alert</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    padding:35px 15px;
    background:#f5f7fb;
  ">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e6e9f0;
      border-radius:18px;
      overflow:hidden;
    ">

      <div style="
        padding:28px 30px;
        background:linear-gradient(135deg,#24283f,#5557dd);
        color:#ffffff;
      ">

        <div style="
          font-size:13px;
          font-weight:700;
          letter-spacing:2px;
        ">
          EXPENSEAI
        </div>

        <h1 style="
          margin:10px 0 0;
          font-size:24px;
        ">
          ${
            exceeded
              ? 'Budget Exceeded'
              : 'Budget Alert'
          }
        </h1>

      </div>

      <div style="padding:30px;">

        <p style="font-size:16px;">
          Hi <strong>${safeName}</strong>,
        </p>

        <p style="
          font-size:14px;
          line-height:1.7;
          color:#667085;
        ">
          ${
            exceeded
              ? `Your <strong>${safeCategory}</strong> budget has been exceeded.`
              : `Your <strong>${safeCategory}</strong> budget has reached <strong>${percentUsed}%</strong>.`
          }
        </p>

        <div style="
          margin:25px 0;
          padding:20px;
          border-radius:14px;
          background:#f7f8fc;
        ">

          <table style="
            width:100%;
            border-collapse:collapse;
            font-size:14px;
          ">

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Category
              </td>

              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
              ">
                ${safeCategory}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Budget
              </td>

              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
              ">
                ₹${formattedBudget}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Spent
              </td>

              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
              ">
                ₹${formattedSpent}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Remaining
              </td>

              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
              ">
                ₹${formattedRemaining}
              </td>
            </tr>

            <tr>
              <td style="padding:8px 0;color:#7b8498;">
                Usage
              </td>

              <td style="
                padding:8px 0;
                text-align:right;
                font-weight:700;
                color:#5557dd;
              ">
                ${percentUsed}%
              </td>
            </tr>

          </table>

        </div>

        <p style="
          font-size:14px;
          line-height:1.7;
          color:#667085;
        ">
          Review your recent expenses in
          <strong>ExpenseAI</strong>
          and adjust your spending if needed.
        </p>

        <div style="
          text-align:center;
          margin:30px 0 10px;
        ">

          <a
            href="${dashboardUrl}"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 26px;
              background:#5557dd;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
            "
          >
            View Dashboard
          </a>

        </div>

        <div style="
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid #e6e9f0;
          text-align:center;
          font-size:12px;
          color:#98a2b3;
        ">
          This is an automated notification from ExpenseAI.
        </div>

      </div>

    </div>

  </div>

</body>
</html>
`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

// =====================================================
// SEND PASSWORD RESET EMAIL
// =====================================================

async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}) {
  const frontendUrl =
    process.env.CLIENT_URL ||
    'http://localhost:5173';

  const resetUrl =
    `${frontendUrl}/reset-password/${resetToken}`;

  const safeName = escapeHtml(name || 'there');

  const subject =
    'ExpenseAI: Reset your password';

  const text = [
    `Hi ${name || 'there'},`,
    '',
    'We received a request to reset your ExpenseAI password.',
    '',
    'Use the link below to create a new password:',
    resetUrl,
    '',
    'This link will expire in 15 minutes.',
    '',
    'If you did not request this password reset, you can safely ignore this email.',
    '',
    'ExpenseAI',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your ExpenseAI password</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
  color:#172033;
">

  <div style="
    padding:35px 15px;
    background:#f5f7fb;
  ">

    <div style="
      max-width:600px;
      margin:0 auto;
      background:#ffffff;
      border:1px solid #e6e9f0;
      border-radius:18px;
      overflow:hidden;
    ">

      <div style="
        padding:28px 30px;
        background:linear-gradient(135deg,#24283f,#5557dd);
        color:#ffffff;
      ">

        <div style="
          font-size:13px;
          font-weight:700;
          letter-spacing:2px;
        ">
          EXPENSEAI
        </div>

        <h1 style="
          margin:10px 0 0;
          font-size:24px;
        ">
          Reset your password
        </h1>

      </div>

      <div style="padding:30px;">

        <p style="font-size:16px;">
          Hi <strong>${safeName}</strong>,
        </p>

        <p style="
          font-size:14px;
          line-height:1.7;
          color:#667085;
        ">
          We received a request to reset your ExpenseAI password.
          Click the button below to create a new password.
        </p>

        <div style="
          text-align:center;
          margin:30px 0;
        ">

          <a
            href="${resetUrl}"
            target="_blank"
            style="
              display:inline-block;
              padding:14px 26px;
              background:#5557dd;
              color:#ffffff;
              text-decoration:none;
              border-radius:10px;
              font-size:14px;
              font-weight:700;
            "
          >
            Reset Password
          </a>

        </div>

        <p style="
          font-size:13px;
          line-height:1.6;
          color:#667085;
        ">
          This password reset link will expire in
          <strong>15 minutes</strong>.
        </p>

        <p style="
          font-size:13px;
          line-height:1.6;
          color:#667085;
        ">
          If you did not request this password reset,
          you can safely ignore this email.
        </p>

        <div style="
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid #e6e9f0;
          text-align:center;
          font-size:12px;
          color:#98a2b3;
        ">
          This is an automated email from ExpenseAI.
        </div>

      </div>

    </div>

  </div>

</body>
</html>
`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

// =====================================================
// SEND EMAIL CHANGE OTP
// =====================================================

async function sendEmailChangeOtp({
  to,
  name,
  otp,
}) {
  const safeName = escapeHtml(name || 'User');
  const safeOtp = escapeHtml(otp);

  const subject =
    'ExpenseAI: Email Change Verification OTP';

  const text = [
    `Hello ${name || 'User'},`,
    '',
    'You requested to change your ExpenseAI email address.',
    '',
    `Your verification OTP is: ${otp}`,
    '',
    'This OTP is valid for 10 minutes.',
    '',
    'If you did not request this change, you can safely ignore this email.',
    '',
    'ExpenseAI',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>ExpenseAI Email Verification</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f7fb;
  font-family:Arial,Helvetica,sans-serif;
">

  <div style="
    padding:35px 15px;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#ffffff;
      border:1px solid #e6e9f0;
      border-radius:18px;
      overflow:hidden;
    ">

      <div style="
        background:linear-gradient(135deg,#24283f,#5557dd);
        color:#ffffff;
        padding:28px 30px;
      ">

        <div style="
          font-size:13px;
          font-weight:700;
          letter-spacing:2px;
        ">
          EXPENSEAI
        </div>

        <h1 style="
          margin:10px 0 0;
          font-size:24px;
        ">
          Verify your email change
        </h1>

      </div>

      <div style="padding:30px;">

        <p style="font-size:16px;">
          Hello <strong>${safeName}</strong>,
        </p>

        <p style="
          color:#667085;
          line-height:1.7;
        ">
          You requested to change your ExpenseAI email address.
          Use the verification code below.
        </p>

        <div style="
          background:#f7f8fc;
          color:#111827;
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          text-align:center;
          padding:18px;
          margin:25px 0;
          border-radius:10px;
        ">
          ${safeOtp}
        </div>

        <p style="
          color:#667085;
          line-height:1.6;
        ">
          This OTP is valid for
          <strong>10 minutes</strong>.
        </p>

        <p style="
          color:#98a2b3;
          font-size:13px;
        ">
          If you did not request this change,
          you can safely ignore this email.
        </p>

        <div style="
          margin-top:28px;
          padding-top:20px;
          border-top:1px solid #e6e9f0;
          text-align:center;
          font-size:12px;
          color:#98a2b3;
        ">
          This is an automated email from ExpenseAI.
        </div>

      </div>

    </div>

  </div>

</body>
</html>
`;

  return sendEmail({
    to,
    subject,
    text,
    html,
  });
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  sendEmail,
  sendBudgetAlertEmail,
  sendPasswordResetEmail,
  sendEmailChangeOtp,
};