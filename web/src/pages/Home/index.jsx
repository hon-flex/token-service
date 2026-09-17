/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { API } from '../../helpers/apiClient';
import { showError } from '../../helpers/appBasics';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { useTranslation } from 'react-i18next';
import {
  OPEN_NOTIFICATION_CENTER_EVENT,
  acknowledgeAnnouncementPopup,
  getAnnouncementPopupKey,
  getLegacyNoticePopupKey,
  isAnnouncementPopupAcknowledged,
} from '../../hooks/common/useNotifications';
import HomeLanding from '../../components/home/landing/HomeLanding';
const NoticeModal = lazy(() => import('../../components/layout/NoticeModal'));
const Home = () => {
  const { i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContent, setHomePageContent] = useState(
    () => localStorage.getItem('home_page_content') || '',
  );
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [noticePopupKey, setNoticePopupKey] = useState('');
  const [legacyNoticeContent, setLegacyNoticeContent] = useState('');
  const noticeCheckedRef = useRef(false);
  const homePageIframeRef = useRef(null);
  const latestAnnouncement = statusState?.status?.announcements?.[0];
  const latestAnnouncementPopupKey = latestAnnouncement
    ? getAnnouncementPopupKey(latestAnnouncement)
    : '';
  const displayHomePageContent = async () => {
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data = '' } = res.data;
      if (!success) {
        showError(message);
        return;
      }

      let content = data;
      if (!data.startsWith('https://') && data !== '') {
        const { marked } = await import('marked');
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } catch (error) {
      console.error('Failed to load home page content:', error);
    }
  };

  const syncHomePageIframe = () => {
    const iframeWindow = homePageIframeRef.current?.contentWindow;
    if (!iframeWindow) return;
    iframeWindow.postMessage({ themeMode: actualTheme }, '*');
    iframeWindow.postMessage({ lang: i18n.language }, '*');
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      if (!statusState?.status) {
        return;
      }

      if (latestAnnouncementPopupKey) {
        if (
          noticeCheckedRef.current === latestAnnouncementPopupKey ||
          isAnnouncementPopupAcknowledged(latestAnnouncementPopupKey)
        ) {
          return;
        }
        noticeCheckedRef.current = latestAnnouncementPopupKey;
        setLegacyNoticeContent('');
        setNoticePopupKey(latestAnnouncementPopupKey);
        setNoticeVisible(true);
        return;
      }

      if (noticeCheckedRef.current === 'legacy') {
        return;
      }
      noticeCheckedRef.current = 'legacy';
      try {
        const res = await API.get('/api/notice');
        const { success, data } = res.data;
        if (success && data && data.trim() !== '') {
          const legacyPopupKey = getLegacyNoticePopupKey(data);
          if (isAnnouncementPopupAcknowledged(legacyPopupKey)) {
            return;
          }
          setLegacyNoticeContent(data);
          setNoticePopupKey(legacyPopupKey);
          setNoticeVisible(true);
        }
      } catch (error) {
        console.error('获取公告失败:', error);
      }
    };

    checkNoticeAndShow();
  }, [latestAnnouncementPopupKey, statusState?.status]);

  const acknowledgeNotice = () => {
    acknowledgeAnnouncementPopup(noticePopupKey);
    setNoticeVisible(false);
  };

  const handleViewMoreNotices = () => {
    acknowledgeNotice();
    window.dispatchEvent(new Event(OPEN_NOTIFICATION_CENTER_EVENT));
  };

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <div className='w-full h-[100dvh] overflow-y-auto home-scroll-container'>
      {noticeVisible ? (
        <Suspense fallback={null}>
          <NoticeModal
            visible
            fallbackContent={legacyNoticeContent}
            onClose={acknowledgeNotice}
            onViewMore={handleViewMoreNotices}
          />
        </Suspense>
      ) : null}
      {homePageContent === '' ? (
        <HomeLanding />
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              ref={homePageIframeRef}
              src={homePageContent}
              className='w-full h-screen border-none'
              onLoad={syncHomePageIframe}
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
