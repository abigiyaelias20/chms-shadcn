'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import {
  FaHome, FaInfoCircle, FaChurch, FaUsers,
  FaBook, FaCalendarAlt, FaPhoneAlt, FaArrowDown,
  FaPlay, FaMapMarkerAlt, FaClock, FaEnvelope,
  FaFacebookF, FaTwitter, FaInstagram, FaCross,
  FaHeart, FaPray,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'react-hot-toast';
import axiosInstance from '@/lib/axios';

export default function HomePage() {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('ministry');
        const ministriesData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        setMinistries(
          ministriesData.map((ministry: any) => ({
            title: ministry.name,
            description: ministry.description,
            icon: getMinistryIcon(ministry.name),
          }))
        );
      } catch (error) {
        console.error('Error fetching ministries:', error);
        toast.error('Failed to load ministries. Displaying sample data.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get('events');
        const eventsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load upcoming events.');
      }
    };

    fetchMinistries();
    fetchEvents();
  }, []);

  const getMinistryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'pastoral ministry': return <FaCross className="text-4xl text-blue-600" />;
      case 'worship ministry': return <FaPray className="text-4xl text-purple-600" />;
      case 'youth ministry': return <FaUsers className="text-4xl text-green-600" />;
      case 'outreach ministry': return <FaHeart className="text-4xl text-red-600" />;
      default: return <FaChurch className="text-4xl text-gray-600" />;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const scrollToSection = (section: string) => {
    sectionRefs.current[section]?.scrollIntoView({ behavior: 'smooth' });
  };

  const getYouTubeId = (url = '') => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2]?.length === 11 ? match[2] : null;
  };

  return (
    <>
      <Head>
        <title>Church Management System</title>
        <meta
          name="description"
          content="Welcome to our Church Management System. Stay connected with ministries, events, and more."
        />
      </Head>
      <Toaster position="top-right" />

      {/* Hero Section */}
      <section
        ref={el => (sectionRefs.current['home'] = el)}
        className="relative h-screen flex items-center justify-center bg-black text-white"
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          playsInline
          muted
          className="w-full h-full object-cover"
          poster="/video-poster.jpg"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Welcome to Our Church</h1>
          <p className="text-lg md:text-2xl mb-8">
            Join us in worship, fellowship, and ministry.
          </p>
          <div className="flex space-x-4">
            <Button onClick={() => scrollToSection('about')} className="bg-blue-600 hover:bg-blue-700">
              Learn More
            </Button>
            <Button onClick={toggleMute} className="bg-gray-800 hover:bg-gray-900">
              {isMuted ? 'Unmute Video' : 'Mute Video'}
            </Button>
          </div>
        </div>
        <div className="absolute bottom-8 flex justify-center w-full">
          <FaArrowDown
            className="text-white text-3xl animate-bounce cursor-pointer"
            onClick={() => scrollToSection('about')}
          />
        </div>
      </section>

      {/* About Section */}
      <section
        ref={el => (sectionRefs.current['about'] = el)}
        className="py-20 px-4 bg-gray-100"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">About Us</h2>
          <p className="text-lg text-gray-700 mb-8">
            Our church is a community of believers committed to following Christ and serving
            others through various ministries and outreach programs.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  To glorify God by making disciples of all nations, sharing His love, and
                  serving our community.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  To be a Christ-centered community growing in faith, hope, and love, impacting
                  the world for Christ.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Ministries Section */}
      <section
        ref={el => (sectionRefs.current['ministries'] = el)}
        className="py-20 px-4 bg-white"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Our Ministries</h2>
          {isLoading ? (
            <p>Loading ministries...</p>
          ) : ministries.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ministries.map((ministry, index) => (
                <Card key={index} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-center mb-4">{ministry.icon}</div>
                    <CardTitle>{ministry.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{ministry.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No ministries available at the moment.</p>
          )}
        </div>
      </section>

      {/* Events Section */}
      <section
        ref={el => (sectionRefs.current['events'] = el)}
        className="py-20 px-4 bg-gray-100"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Upcoming Events</h2>
          {events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map(event => (
                <Card key={event.id} className="hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {new Date(event.start_date).toLocaleDateString()} -{' '}
                      {new Date(event.end_date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{event.description}</p>
                    <div className="flex items-center mt-4 text-sm text-gray-600">
                      <FaMapMarkerAlt className="mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <FaClock className="mr-2" />
                      {new Date(event.start_date).toLocaleTimeString()}
                    </div>
                    {event.video_url && getYouTubeId(event.video_url) && (
                      <div className="mt-4">
                        <iframe
                          width="100%"
                          height="200"
                          src={`https://www.youtube.com/embed/${getYouTubeId(event.video_url)}`}
                          title={event.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No upcoming events at this time.</p>
          )}
        </div>
      </section>
    </>
  );
}
