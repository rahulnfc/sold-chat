import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ImageCarousel from '@/components/ImageCarousel';
import { Button } from "@/components/ui/button";
import { useAuth } from '../context/AuthContext';

const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/ad/${id}`);
        setPost(response.data.data);
      } catch (error) {
        console.error('Error fetching post:', error);
      }
    };

    fetchPost();
  }, [id]);

  if (!post) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <ImageCarousel
          images={post.images}
          autoplayInterval={3000}
        />
        <h1 className="text-2xl font-bold mt-6 mb-2">{post.title}</h1>
        <p className="text-gray-600 mb-4">{post.description}</p>
        <p className="text-xl font-semibold">Price: {post.price} {post.currency}</p>
        <p className="text-lg font-medium">Location: {post.location.address.state_district}, {post.location.address.state}, {post.country}</p>
        <p className="text-lg font-medium">Category: {post.category.name.en}</p>
        {user && (
          <Link 
            to={{
              pathname: '/chats',
              state: { postId: post._id, userId: user.id, publisherId: post.postedBy._id } // Pass necessary data
            }}
          >
            <Button className="mt-6" variant="secondary"> Start Chat </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PostDetail;
