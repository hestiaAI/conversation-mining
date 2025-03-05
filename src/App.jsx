import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const App = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    agentId: ''
  });
  
  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
    progress: ''
  });

  const [chatData, setChatData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({
      loading: true,
      success: false,
      error: null,
      progress: 'Authentification en cours...'
    });

    try {
      // Authentification
      const formDataAuth = new URLSearchParams({
        grant_type: '',
        username: formData.username,
        password: formData.password,
        scope: '',
        client_id: '',
        client_secret: ''
      });

      const authResponse = await fetch('https://api.argo.hestia.ai/auth/token', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formDataAuth
      });

      if (!authResponse.ok) {
        throw new Error(`Erreur d'authentification: ${authResponse.status}`);
      }

      const authData = await authResponse.json();
      const token = authData[Object.keys(authData)[0]];

      // Récupération des chats
      setStatus(prev => ({ ...prev, progress: 'Récupération des chats...' }));
      
      const chatsResponse = await fetch(
        `https://api.argo.hestia.ai/chat?agent_id=${formData.agentId}&page=1&per_page=10`,
        {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!chatsResponse.ok) {
        throw new Error(`Erreur lors de la récupération des chats: ${chatsResponse.status}`);
      }

      const chatsData = await chatsResponse.json();
      
      // Récupération des messages pour chaque chat
      const results = {
        agentId: formData.agentId,
        timestamp: new Date().toISOString(),
        chats: []
      };

      for (let i = 0; i < chatsData.items.length; i++) {
        const chat = chatsData.items[i];
        setStatus(prev => ({
          ...prev,
          progress: `Récupération du chat ${i + 1}/${chatsData.items.length}...`
        }));

        try {
          const messagesResponse = await fetch(
            `https://api.argo.hestia.ai/chat/${chat.id}/message`,
            {
              headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (!messagesResponse.ok) {
            throw new Error(`Erreur pour le chat ${chat.id}: ${messagesResponse.status}`);
          }

          const messageData = await messagesResponse.json();
          results.chats.push({
            id: chat.id,
            name: chat.chat_name,
            creationTime: chat.creation_time,
            messages: messageData
          });

        } catch (error) {
          console.error(`Erreur pour le chat ${chat.id}:`, error);
          results.chats.push({
            id: chat.id,
            name: chat.chat_name,
            error: error.message
          });
        }

        // Délai entre les requêtes
        if (i < chatsData.items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('Résultats:', {
        totalChats: chatsData.items.length,
        successCount: results.chats.filter(chat => !chat.error).length,
        errorCount: results.chats.filter(chat => chat.error).length
      });

      setChatData(results);
      setStatus({
        loading: false,
        success: true,
        error: null,
        progress: `${results.chats.filter(chat => !chat.error).length} chats récupérés avec succès`
      });

    } catch (error) {
      setStatus({
        loading: false,
        success: false,
        error: error.message,
        progress: ''
      });
    }
  };

  const handleDownload = () => {
    if (!chatData) return;

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `conversations_${formData.agentId}_${timestamp}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FF]">
      <div className="w-full flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Login
            </h2>
            <p className="text-center text-gray-600">
            Log in to access your conversations
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent ID
              </label>
              <input
                type="text"
                name="agentId"
                value={formData.agentId}
                onChange={handleChange}
                placeholder="Enter agent ID"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>

            {status.error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                {status.error}
              </div>
            )}

            {status.progress && (
              <div className="bg-violet-50 text-violet-600 p-4 rounded-lg text-sm">
                {status.progress}
              </div>
            )}

            {status.success && (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm">
                Recovery successfully completed !
              </div>
            )}

            <div className="space-y-3">
              <button 
                type="submit" 
                className="w-full bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors disabled:opacity-50 font-medium"
                disabled={status.loading}
              >
                {status.loading ? 'Chargement...' : 'Log in'}
              </button>

              {chatData && (
                <button 
                  type="button"
                  onClick={handleDownload}
                  className="w-full bg-white text-violet-600 border border-violet-600 py-3 px-4 rounded-lg hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Download conversations
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;