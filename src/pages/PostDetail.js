import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from "@/components/ui/button";
import { useAuth } from '../context/AuthContext';

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();
  const token = user?.token;

  const fetchPost = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/ad/${id}`);
      setPost(response.data.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleStartChat = async () => {
    if (!token || !post) return; // Check if token and post data are available
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('http://localhost:8000/api/conversations', { postId: post._id, postOwnerId: post.postedBy._id }, { headers });
      navigate(`/chats/${response.data.data._id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (!post) return <div>Loading...</div>;

  const { title, description, price, currency, location, country, category, images, postedBy } = post;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <ImageCarousel images={images} autoplayInterval={3000} />
        <h1 className="text-2xl font-bold mt-6 mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">{description}</p>
        <p className="text-xl font-semibold">Price: {price} {currency}</p>
        <p className="text-lg font-medium">Location: {location.address.state_district}, {location.address.state}, {country}</p>
        <p className="text-lg font-medium">Category: {category.name.en}</p>
        {user && user.id !== postedBy._id && (
          <Button className="mt-6" variant="secondary" onClick={handleStartChat}>
            Start Chat
          </Button>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
