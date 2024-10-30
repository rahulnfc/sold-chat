import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Image } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('http://user.sold.dxg.world/api/ad?page=1&limit=10');
        setPosts(response.data.data.ads);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch posts');
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Latest Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post._id} className="hover:shadow-lg transition-shadow">
            <Image src={(!post.images[0] || post.images?.[0]?.includes('user.sold.dxg.world')) ? 'https://archive.org/download/placeholder-image/placeholder-image.jpg' : post.images[0]} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 line-clamp-3">{post.description}</p>
              <p className="text-xl font-bold mt-4">${post.price}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link to={`/posts/${post._id}`}>
                <Button variant="outline">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Home;