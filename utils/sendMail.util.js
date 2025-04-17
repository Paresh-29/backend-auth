import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendVerificationEmail = async (email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verficationLink = `${process.env.BASE_URL}/api/v1/users/verify/${token}`;

    const mailOptions = {
      from: `"Authentication App" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Please verify your email address",
      text: `Click on the following link to verify your email address: ${verficationLink}`,
      html: `<p>Click on the following link to verify your email address:</p><a href="${verficationLink}">Verify Email</a>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email send: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

export default sendVerificationEmail;
