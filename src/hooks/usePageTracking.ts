import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const usePageTracking = () => {
  const location = useLocation();

  const logPageView = async (path: string, data?: any) => {
    try {
      await supabase.functions.invoke('log', {
        body: {
          domain: window.location.hostname,
          path,
          data_entered: data || null
        }
      });
    } catch (error) {
      console.error('Failed to log page view:', error);
    }
  };

  const logFormSubmission = async (formType: string, formData: any) => {
    try {
      await supabase.functions.invoke('log', {
        body: {
          domain: window.location.hostname,
          path: location.pathname,
          data_entered: {
            action: 'form_submission',
            form_type: formType,
            form_data: formData
          }
        }
      });
    } catch (error) {
      console.error('Failed to log form submission:', error);
    }
  };

  // Log page view on route change
  useEffect(() => {
    logPageView(location.pathname);
  }, [location.pathname]);

  return { logPageView, logFormSubmission };
};