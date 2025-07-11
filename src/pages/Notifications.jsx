import {
  Box,
  Flex,
  Heading,
  Text,
  Avatar,
  Badge,
  Divider,
  useColorModeValue,
  IconButton,
  Button,
  VStack,
  HStack,
  useToast,
  Icon,
  Container,
  useBreakpointValue,
  Center,
} from "@chakra-ui/react";
import { FiArrowLeft, FiTrash2, FiBell, FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getNotifications, markNotificationAsRead, deleteNotification as deleteNotificationApi, markAllNotificationsAsRead } from "../services/notificationService";

const Notifications = () => {
  // Colors
  const bgColor = useColorModeValue("#f0f4f8", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("brand.navy", "white");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("brand.gold", "brand.goldDark");
  const primaryColor = useColorModeValue("brand.navy", "brand.navyDark");
  const boxShadow = useColorModeValue(
    "0 4px 20px rgba(0, 0, 0, 0.1)",
    "0 4px 20px rgba(0, 0, 0, 0.3)"
  );
  const cardBgHover = useColorModeValue("gray.50", "gray.700");
  
  // Responsive design
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Toast
  const toast = useToast();
  const navigate = useNavigate();
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getNotifications(currentPage);
        const mapNotification = n => ({
          id: n.id,
          user: n.sender_name || 'System',
          avatar: n.sender_avatar,
          content: n.data?.message || '',
          isRead: !!n.read,
          time: formatTime(n.created_at),
          url: n.url,
        });
        setNotifications(data.data ? data.data.map(mapNotification) : []);
        setTotalPages(data.last_page || 1);
        setCurrentPage(data.current_page || 1);
      } catch (err) {
        setError("Failed to load notifications");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [currentPage]);

  const markAllAsRead = async () => {
    // Optimistically update UI
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    try {
      const response = await markAllNotificationsAsRead();
      toast({
        title: response?.message || 'All notifications marked as read',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      toast({
        title: 'Failed to mark all as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id) => {
    setNotifications(notifications =>
      notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      // Optionally revert or show error
    }
  };

  // Helper: Format time as relative (e.g., '2h ago') or date
  function formatTime(isoString) {
    if (!isoString) return '';
    const now = new Date();
    const date = new Date(isoString);
    const diff = (now - date) / 1000; // seconds
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  const handleDeleteNotification = async (id) => {
    // Optimistically remove from UI
    setNotifications(current => current.filter((notif) => notif.id !== id));
    try {
      const response = await deleteNotificationApi(id);
      toast({
        title: response?.message || 'Notification deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      toast({
        title: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      console.error('Failed to delete notification', err);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.url) {
      try {
        const path = new URL(notification.url).pathname;
        navigate(path);
      } catch (e) {
        console.error("Invalid URL for notification:", notification.url);
        toast({
          title: 'Invalid notification link',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Box minH="100vh" bg={bgColor} py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
      <Container maxW="900px">
        <Flex
          direction="column"
          mx="auto"
          bg={cardBg}
          borderRadius="xl"
          overflow="hidden"
          boxShadow={boxShadow}
        >
          <Flex
            p={4}
            align="center"
            justify="space-between"
            borderBottom="1px solid"
            borderColor={borderColor}
            bg={useColorModeValue("gray.50", "gray.750")}
          >
            <HStack spacing={3}>
              <IconButton
                as={Link}
                to="/dashboard"
                icon={<FiChevronLeft size={18} />}
                variant="ghost"
                aria-label="Go back"
                color={textColor}
                borderRadius="full"
                size="md"
                _hover={{ bg: `${accentColor}20` }}
              />
              <Icon as={FiBell} color={accentColor} boxSize={5} />
              <Heading size="md" color={textColor}>
                Notifications
              </Heading>
              {unreadCount > 0 && (
                <Badge
                  px={2}
                  py={1}
                  bg={accentColor}
                  color={primaryColor}
                  borderRadius="full"
                  fontWeight="medium"
                >
                  {unreadCount} new
                </Badge>
              )}
            </HStack>
            <Button
              size="sm"
              colorScheme="gray"
              variant="ghost"
              onClick={markAllAsRead}
              leftIcon={<FiCheck />}
              isDisabled={unreadCount === 0}
              _hover={{ bg: `${accentColor}20` }}
            >
              Mark all as read
            </Button>
          </Flex>

          <Box>
            {loading ? (
              <Center py={16}><Text color={mutedText}>Loading notifications...</Text></Center>
            ) : error ? (
              <Center py={16}><Text color="red.400">{error}</Text></Center>
            ) : notifications.length > 0 ? (
              <>
              <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
                {notifications.map((notification) => (
                  <Box key={notification.id}>
                    <Flex
                      p={5}
                      position="relative"
                      bg={notification.isRead ? "transparent" : `${accentColor}10`}
                      _hover={{ bg: cardBgHover }}
                      transition="all 0.2s ease"
                      borderLeft="3px solid"
                      borderLeftColor={notification.isRead ? "transparent" : accentColor}
                      onClick={() => handleNotificationClick(notification)}
                      cursor={notification.url ? 'pointer' : 'default'}
                    >
                      <Box position="relative">
                        <Avatar
                          size="md"
                          name={notification.user}
                          src={notification.avatar}
                          border="2px solid"
                          borderColor={notification.isRead ? borderColor : accentColor}
                        />
                        {!notification.isRead && (
                          <Badge
                            position="absolute"
                            top="-1"
                            right="-1"
                            bg={accentColor}
                            boxSize="10px"
                            borderRadius="full"
                            border="2px solid"
                            borderColor={cardBg}
                          />
                        )}
                      </Box>
                      <Box ml={4} flex="1">
                        <Flex align="baseline" justify="space-between">
                          <Text 
                            fontWeight={notification.isRead ? "medium" : "bold"} 
                            color={textColor}
                          >
                            {notification.user}
                          </Text>
                          <Text fontSize="sm" color={mutedText}>
                            {notification.time}
                          </Text>
                        </Flex>
                        <Text mt={1} color={notification.isRead ? mutedText : textColor}>
                          {notification.content}
                        </Text>
                      </Box>
                      <IconButton
                        icon={<FiTrash2 />}
                        variant="ghost"
                        colorScheme="red"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        aria-label="Delete notification"
                        alignSelf="center"
                        borderRadius="full"
                        opacity={0.7}
                        _hover={{ opacity: 1 }}
                      />
                    </Flex>
                  </Box>
                ))}
              </VStack>
              
              {totalPages > 1 && (
                <Flex justify="center" align="center" p={4} borderTop="1px solid" borderColor={borderColor}>
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    leftIcon={<FiChevronLeft />}
                    mr={2}
                  >
                    Previous
                  </Button>
                  <Text color={mutedText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    rightIcon={<FiChevronRight />}
                    ml={2}
                  >
                    Next
                  </Button>
                </Flex>
              )}
            </>
            ) : (
              <Center py={16}>
                <VStack spacing={4}>
                  <Box 
                    p={4} 
                    borderRadius="full" 
                    bg={`${accentColor}20`}
                  >
                    <Icon 
                      as={FiBell} 
                      fontSize="3xl" 
                      color={accentColor} 
                    />
                  </Box>
                  <Heading size="md" color={textColor}>
                    No notifications
                  </Heading>
                  <Text color={mutedText} textAlign="center" maxW="350px">
                    You're all caught up! Check back later for updates and activities from your courses and study groups.
                  </Text>
                  <Button 
                    as={Link} 
                    to="/dashboard"
                    mt={2}
                    leftIcon={<FiArrowLeft />}
                    colorScheme="gray" 
                    variant="outline"
                    _hover={{ bg: `${accentColor}20`, borderColor: accentColor }}
                  >
                    Return to Dashboard
                  </Button>
                </VStack>
              </Center>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default Notifications;
