// pages/index.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { 
  FaHome, FaInfoCircle, FaChurch, FaUsers, 
  FaBook, FaCalendarAlt, FaPhoneAlt, FaArrowDown,
  FaPlay, FaMapMarkerAlt, FaClock, FaEnvelope,
  FaFacebookF, FaTwitter, FaInstagram, FaCross,
  FaHeart, FaPray, FaHandsHelping
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ChurchHomepage() {
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionRefs = useRef({});

  const navItems = [
    { id: 'home', label: 'Home', icon: <FaHome size={18} /> },
    { id: 'about', label: 'About', icon: <FaInfoCircle size={18} /> },
    { id: 'services', label: 'Services', icon: <FaChurch size={18} /> },
    { id: 'ministries', label: 'Ministries', icon: <FaUsers size={18} /> },
    { id: 'sermons', label: 'Sermons', icon: <FaBook size={18} /> },
    { id: 'events', label: 'Events', icon: <FaCalendarAlt size={18} /> },
    { id: 'contact', label: 'Contact', icon: <FaPhoneAlt size={18} /> },
  ];

  const services = [
    {
      time: '8:30 AM',
      title: 'Traditional Service',
      description: 'A classic worship experience with hymns and liturgy'
    },
    {
      time: '10:30 AM',
      title: 'Contemporary Service',
      description: 'Modern worship with a full band and relevant message'
    },
    {
      time: '6:30 PM',
      title: 'Evening Prayer',
      description: 'A quiet reflective service for midweek renewal'
    }
  ];

  const ministries = [
    {
      title: 'Children\'s Ministry',
      description: 'Engaging programs for kids to learn about faith',
      icon: <FaHeart size={30} />
    },
    {
      title: 'Youth Group',
      description: 'A community for teens to grow in faith',
      icon: <FaUsers size={30} />
    },
    {
      title: 'Men\'s Fellowship',
      description: 'Brotherhood and spiritual growth',
      icon: <FaHandsHelping size={30} />
    },
    {
      title: 'Women\'s Circle',
      description: 'Support, study and service for women',
      icon: <FaPray size={30} />
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      const scrollPosition = window.scrollY + 100;
      
      for (const [sectionId, ref] of Object.entries(sectionRefs.current)) {
        if (ref) {
          const offsetTop = ref.offsetTop;
          const offsetBottom = offsetTop + ref.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setIsMobileMenuOpen(false);
    const section = sectionRefs.current[sectionId];
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <Head>
        <title>Grace Community Church</title>
        <meta name="description" content="Welcome to Grace Community Church" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen w-full overflow-x-hidden">
        {/* Navigation Bar */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 shadow-sm' : 'py-4'}`}>
          <div className="container mx-auto px-4 flex justify-between items-center">
            <motion.div 
              className="flex items-center cursor-pointer"
              onClick={() => scrollToSection('home')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-md flex items-center justify-center mr-2">
                <FaCross size={20} />
              </div>
              <span className="font-bold text-xl font-serif text-primary">Grace Community</span>
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "secondary" : "ghost"}
                  className={`flex flex-col items-center h-14 px-3 ${activeSection === item.id ? 'bg-primary/10' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  <span className="mb-1">{item.icon}</span>
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="space-y-1.5">
                <span className={`block h-0.5 w-6 bg-foreground transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-foreground ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`block h-0.5 w-6 bg-foreground transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="fixed top-16 inset-x-0 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 z-40 md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="container mx-auto px-4 py-4">
                <div className="grid gap-2">
                  {navItems.map(item => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "secondary" : "ghost"}
                      className="justify-start"
                      onClick={() => scrollToSection(item.id)}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section 
          id="home" 
          className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-background to-muted/50"
          ref={el => sectionRefs.current['home'] = el}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
          
          <div className="container mx-auto px-4 text-center z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-primary font-serif font-bold text-xl mb-4">Grace Community Church</div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Welcome to Our Spiritual Home</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Where faith, community, and love come together in worship
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => scrollToSection('services')}>
                  Join Us for Service
                </Button>
                <Button variant="outline" size="lg" onClick={() => scrollToSection('about')}>
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-sm mb-2">Scroll Down</span>
            <FaArrowDown />
          </motion.div>
        </section>

        {/* About Section */}
        <section 
          id="about" 
          className="py-20 bg-muted/30"
          ref={el => sectionRefs.current['about'] = el}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">About Our Church</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                A community of faith, hope, and love serving together since 1952
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center border-0 shadow-lg">
                  <CardHeader>
                    <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCross size={24} className="text-primary" />
                    </div>
                    <CardTitle>Our Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>To spread the love of Christ, nurture spiritual growth, and serve our community with compassion and grace.</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center border-0 shadow-lg">
                  <CardHeader>
                    <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBook size={24} className="text-primary" />
                    </div>
                    <CardTitle>Our History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Founded in 1952, Grace Community Church has been a cornerstone of faith in our community for generations.</p>
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center border-0 shadow-lg">
                  <CardHeader>
                    <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaChurch size={24} className="text-primary" />
                    </div>
                    <CardTitle>Our Beliefs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>We believe in the Holy Trinity, salvation through Jesus Christ, the power of prayer, and the importance of community.</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section 
          id="services" 
          className="py-20"
          ref={el => sectionRefs.current['services'] = el}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Worship Services</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join us for worship and fellowship throughout the week
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full text-center border-0 shadow-lg relative overflow-hidden">
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-md">
                      <FaChurch size={18} />
                    </div>
                    <CardHeader>
                      <div className="text-2xl font-bold text-primary mb-2">{service.time}</div>
                      <CardTitle>{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{service.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Ministries Section */}
        <section 
          id="ministries" 
          className="py-20 bg-muted/30"
          ref={el => sectionRefs.current['ministries'] = el}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Our Ministries</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Find your place to serve and grow within our church community
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {ministries.map((ministry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                      <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        {ministry.icon}
                      </div>
                      <CardTitle>{ministry.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{ministry.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sermons Section */}
        <section 
          id="sermons" 
          className="py-20"
          ref={el => sectionRefs.current['sermons'] = el}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Recent Sermons</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Messages of hope and inspiration from our pastoral team
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="h-48 bg-gradient-to-r from-primary/20 to-muted/30 flex items-center justify-center">
                      <div className="bg-primary/90 text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center">
                        <FaPlay size={20} className="ml-1" />
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle>The Power of Faith</CardTitle>
                      <CardDescription>Pastor John Smith • October 15, 2023</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        <FaPlay size={14} className="mr-2" />
                        Listen Now
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section 
          id="events" 
          className="py-20 bg-muted/30"
          ref={el => sectionRefs.current['events'] = el}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Upcoming Events</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Join us for fellowship and community activities
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { day: '24', month: 'NOV', title: 'Community Thanksgiving Dinner', desc: 'Join us for our annual Thanksgiving dinner. All are welcome for food, fellowship, and gratitude.', time: '4:00 PM - 7:00 PM' },
                { day: '12', month: 'NOV', title: 'Youth Group Fall Retreat', desc: 'A weekend of fun, faith, and fellowship for our youth members.', time: 'All Day' },
                { day: '05', month: 'DEC', title: 'Christmas Choir Rehearsal', desc: 'Practice for our annual Christmas celebration concert.', time: '7:00 PM - 9:00 PM' }
              ].map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary p-4 rounded-lg min-w-[70px]">
                          <span className="text-2xl font-bold">{event.day}</span>
                          <span className="text-sm font-medium">{event.month}</span>
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-lg mb-2">{event.title}</h3>
                          <p className="text-muted-foreground mb-3">{event.desc}</p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <FaClock size={14} className="mr-2" />
                            {event.time}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section 
          id="contact" 
          className="py-20"
          ref={el => sectionRefs.current['contact'] = el}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We'd love to hear from you and welcome you to our community
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <FaMapMarkerAlt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Address</h3>
                    <p className="text-muted-foreground">1234 Faith Avenue<br />Hopeville, CA 12345</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <FaPhoneAlt size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Phone</h3>
                    <p className="text-muted-foreground">(555) 123-4567</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <FaEnvelope size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Email</h3>
                    <p className="text-muted-foreground">info@gracechurch.org</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <FaClock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Service Times</h3>
                    <p className="text-muted-foreground">Sunday: 8:30 AM & 10:30 AM<br />Wednesday: 6:30 PM</p>
                  </div>
                </div>
              </div>
              
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input id="name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea id="message" placeholder="How can we help you?" rows={5} />
                    </div>
                    <Button type="submit" className="w-full">Send Message</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary text-primary-foreground py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-foreground text-primary w-10 h-10 rounded-md flex items-center justify-center mr-2">
                    <FaCross size={20} />
                  </div>
                  <span className="font-bold text-xl font-serif">Grace Community</span>
                </div>
                <p className="text-center md:text-left text-primary-foreground/80">
                  A place of worship, community, and spiritual growth since 1952.
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                {navItems.map(item => (
                  <Button 
                    key={item.id} 
                    variant="link" 
                    className="text-primary-foreground"
                    onClick={() => scrollToSection(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              
              <div className="flex justify-center md:justify-end gap-4">
                <Button variant="secondary" size="icon" className="rounded-full">
                  <FaFacebookF />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <FaTwitter />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <FaInstagram />
                </Button>
              </div>
            </div>
            
            <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/70">
              <p>&copy; {new Date().getFullYear()} Grace Community Church. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}