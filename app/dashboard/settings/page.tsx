'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  LogOut,
  Eye,
  EyeOff,
  Shield,
  Users,
  Check,
  AlertCircle,
  Building,
  Settings,
  User as UserIcon,
  Lock,
  Mail,
  FileText
} from 'lucide-react';
import { 
  User, 
  UserRole, 
  FACULTIES, 
  createUserAccount, 
  getRoleDisplayName,
  getRoleColor,
  hasPermission,
  PERMISSIONS
} from '@/lib/auth';

interface NewUserForm {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  role: UserRole | '';
  facultyId: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<NewUserForm>({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    role: '',
    facultyId: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleCreateAccount = async () => {
    if (!user) return;

    // Validation
    if (!formData.username || !formData.password || !formData.confirmPassword || 
        !formData.fullName || !formData.email || !formData.role) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    // For KHOA accounts, faculty is required
    if (formData.role === 'KHOA' && !formData.facultyId) {
      toast({
        title: 'Faculty Required',
        description: 'Please select a faculty for KHOA accounts',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createUserAccount(user, {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role as UserRole,
        facultyId: formData.facultyId
      });

      if (result.success) {
        toast({
          title: 'Account Created Successfully',
          description: `${getRoleDisplayName(formData.role as UserRole)} account created for ${formData.fullName}`,
        });

        // Reset form
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          email: '',
          role: '',
          facultyId: ''
        });
      } else {
        toast({
          title: 'Account Creation Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const updateFormData = (field: keyof NewUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAccessibleFaculties = () => {
    if (!user) return [];
    
    if (user.role === 'PGV') {
      return FACULTIES; // PGV can assign to any faculty
    }
    
    if (user.role === 'KHOA' && user.faculty) {
      return [user.faculty]; // KHOA can only assign to their own faculty
    }
    
    return [];
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings & Account Management</h1>
          <p className="text-gray-600 mt-1">Manage system settings and create user accounts</p>
        </div>
        <Button 
          onClick={handleLogout}
          className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="account-creation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account-creation" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Account Management
          </TabsTrigger>
          <TabsTrigger value="system-settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>

        {/* Account Creation Tab */}
        <TabsContent value="account-creation" className="space-y-6">
          {/* User Permissions Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Your Access Permissions
              </CardTitle>
              <CardDescription>
                Current role and account creation privileges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className={`${getRoleColor(user.role)} text-sm`}>
                  {user.role}
                </Badge>
                <span className="text-gray-700">{getRoleDisplayName(user.role)}</span>
              </div>
              
              {user.canCreateAccounts.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">You can create accounts for:</p>
                  <div className="flex gap-2">
                    {user.canCreateAccounts.map((accountType) => (
                      <Badge key={accountType} variant="outline" className="text-sm">
                        {getRoleDisplayName(accountType)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your role does not have permission to create user accounts.
                  </AlertDescription>
                </Alert>
              )}

              {user.faculty && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>Faculty: {user.faculty.name}</span>
                </div>
              )}

              {user.selectedFaculty && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Building className="h-4 w-4" />
                  <span>Currently Managing: {user.selectedFaculty.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Creation Form */}
          {user.canCreateAccounts.length > 0 && (
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Create New User Account</CardTitle>
                <CardDescription>
                  Fill in the information below to create a new user account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Role Selection */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      User Role *
                    </Label>
                    <Select value={formData.role} onValueChange={(value: UserRole) => {
                      updateFormData('role', value);
                      updateFormData('facultyId', ''); // Reset faculty when role changes
                    }}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        {user.canCreateAccounts.map((accountType) => (
                          <SelectItem key={accountType} value={accountType}>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleColor(accountType)}>
                                {accountType}
                              </Badge>
                              {getRoleDisplayName(accountType)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Faculty Selection (for KHOA accounts) */}
                  {formData.role === 'KHOA' && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="faculty" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Faculty Assignment *
                      </Label>
                      <Select value={formData.facultyId} onValueChange={(value) => updateFormData('facultyId', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAccessibleFaculties().map((faculty) => (
                            <SelectItem key={faculty.id} value={faculty.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{faculty.name}</span>
                                <span className="text-xs text-gray-500">{faculty.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) => updateFormData('fullName', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Username *
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter username"
                      value={formData.username}
                      onChange={(e) => updateFormData('username', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password (min. 6 characters)"
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className="h-11 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={handleCreateAccount}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Current system configuration and user information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">System Version</Label>
                  <p className="text-sm text-gray-600">Student Management System v2.0</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Access Control</Label>
                  <p className="text-sm text-gray-600">Role-Based Permission System</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Current User</Label>
                  <p className="text-sm text-gray-600">{user.fullName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Login Session</Label>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Partition Access</CardTitle>
              <CardDescription>
                Information about your current data access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Data Partitions:</span>
                  <div className="flex gap-2">
                    {user.dataPartition.map((partition) => (
                      <Badge key={partition} variant="outline">
                        {partition === 'all' ? 'All Departments' : partition.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Permissions:</span>
                  <Badge variant="outline">{user.permissions.length} permissions</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}