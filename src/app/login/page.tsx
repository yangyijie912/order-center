import React from 'react';
import AuthSwitcherClient from '../components/AuthSwitcherClient';

export default function LoginPage() {
  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ marginTop: 0 }}>登录 / 切换角色</h2>
      <p style={{ color: '#666' }}>
        使用模拟登录切换身份：<strong>admin</strong>、<strong>operator</strong>、<strong>viewer</strong>。
      </p>
      <div style={{ marginTop: 16 }}>
        <AuthSwitcherClient />
      </div>
    </div>
  );
}
