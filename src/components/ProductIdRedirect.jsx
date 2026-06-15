import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ProductIdRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slug, setSlug] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.get(`products/${id}`, { signal: controller.signal })
      .then(res => {
        if (res.data?.slug) {
          setSlug(res.data.slug);
        } else {
          // Fallback if slug not available yet
          setSlug(null);
          setError(true);
        }
      })
      .catch(err => {
        if (err.name !== 'CanceledError') setError(true);
      });
    return () => controller.abort();
  }, [id]);

  if (error) return <Navigate to="/products" replace />;
  if (slug) return <Navigate to={`/products/${slug}`} replace />;
  
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
