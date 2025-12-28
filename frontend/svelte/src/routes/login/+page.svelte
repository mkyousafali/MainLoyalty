<script lang="ts">
</script>

<div class="login-container">
  <div class="content-wrapper">
    <img src="/logo.png" alt="Logo" class="logo" />
    <div class="messages">
      <p class="message">The service is temporarily unavailable</p>
      <p class="message ar">الخدمة غير متاحة مؤقتاً</p>
      <p class="mission">We are on a mission to give you a better experience</p>
      <p class="mission ar">نحن في مهمة لنقدم لك تجربة أفضل</p>
      <p class="thank-you">Thank you for visiting</p>
      <p class="thank-you ar">شكراً لزيارتك</p>
    </div>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 30px;
    background: white;
    padding: 40px 30px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
    text-align: center;
  }

  .logo {
    max-width: 150px;
    height: auto;
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .message {
    font-size: 18px;
    color: #666;
    margin: 0;
    font-weight: 500;
  }

  .message.ar {
    font-size: 20px;
    direction: rtl;
  }

  .mission {
    font-size: 16px;
    color: #999;
    margin: 15px 0 0 0;
    font-style: italic;
    font-weight: 400;
  }

  .mission.ar {
    font-size: 16px;
    direction: rtl;
  }

  .thank-you {
    font-size: 14px;
    color: #aaa;
    margin: 10px 0 0 0;
    font-weight: 400;
  }

  .thank-you.ar {
    font-size: 14px;
    direction: rtl;
  }

  @media (max-width: 768px) {
    .login-container {
      padding: 15px;
    }

    .content-wrapper {
      padding: 30px 20px;
      gap: 20px;
    }

    .logo {
      max-width: 120px;
    }

    .message {
      font-size: 16px;
    }

    .message.ar {
      font-size: 18px;
    }

    .mission {
      font-size: 14px;
    }

    .mission.ar {
      font-size: 14px;
    }

    .thank-you {
      font-size: 12px;
    }

    .thank-you.ar {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .content-wrapper {
      padding: 25px 15px;
      gap: 15px;
    }

    .logo {
      max-width: 100px;
    }

    .message {
      font-size: 14px;
    }

    .message.ar {
      font-size: 16px;
    }

    .mission {
      font-size: 12px;
    }

    .mission.ar {
      font-size: 12px;
    }

    .thank-you {
      font-size: 11px;
    }

    .thank-you.ar {
      font-size: 11px;
    }
  }
</style>
