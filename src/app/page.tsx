'use client';

import {useState, useCallback, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateImageCaption} from '@/ai/flows/generate-image-caption';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {useToast} from '@/hooks/use-toast';
import {ImageIcon, Volume2, Camera} from 'lucide-react';
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Checkbox} from "@/components/ui/checkbox";

const StartScreen = ({onNext}: { onNext: () => void }) => {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleNext = () => {
    if (privacyAccepted && termsAccepted) {
      onNext();
    } else {
      alert('Please accept both Privacy Policy and Terms of Use to continue.');
    }
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-white text-center mb-8">
          <h1 className="text-4xl font-bold">-CAPROM-</h1>
          <p className="text-2xl">Welcome</p>
        </div>
        <div className="bg-card rounded-[1rem] w-full max-w-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="privacy" className="text-sm text-muted-foreground">
              I agree and accept <a href="#" className="text-primary">Privacy Policy</a>
            </label>
            <Checkbox id="privacy" checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree and accept <a href="#" className="text-primary">Terms of Use</a>
            </label>
            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={setTermsAccepted} />
          </div>
          <Button onClick={handleNext} disabled={!privacyAccepted || !termsAccepted} className="w-full bg-primary text-primary-foreground rounded-full">
            Next
          </Button>
        </div>
      </div>
  );
};

const NameInputScreen = ({ onNext }: { onNext: (name: string) => void }) => {
  const [name, setName] = useState('');

  const handleContinue = () => {
    if (name.trim() !== '') {
      onNext(name);
    } else {
      alert('Tell us your Name😊');
    }
  };

  return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-white text-center mb-8">
          <h1 className="text-3xl font-bold">Tell us your name!</h1>
        </div>
        <div className="w-full max-w-md space-y-4">
          <Input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-full bg-card text-foreground placeholder-gray-300"
          />
          <Button onClick={handleContinue} className="w-full bg-primary text-primary-foreground rounded-full">
            Continue
          </Button>
        </div>
      </div>
  );
};


export default function Home() {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showNameInputScreen, setShowNameInputScreen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const {toast} = useToast();
  const synth = useRef<SpeechSynthesis | null>(null);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;
      setSpeechSynthesisSupported(true);
    }
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
  }, []);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCaption = useCallback(async () => {
    if (!image) {
      toast({
        title: 'Error',
        description: 'Please upload an image first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateImageCaption({photoUrl: image});
      setCaption(result.caption);
      toast({
        title: 'Caption Generated',
        description: 'AI has generated a caption for your image.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate caption.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [image, toast]);

  const handleTextToSpeech = useCallback(async () => {
    if (!caption) {
      toast({
        title: 'Error',
        description: 'Please generate a caption first.',
        variant: 'destructive',
      });
      return;
    }

    if (!speechSynthesisSupported || !synth.current) {
      toast({
        title: 'Error',
        description: 'Text-to-speech is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use the Web Speech API to convert text to speech
      const utterance = new SpeechSynthesisUtterance(caption);

      // Create a promise to handle the onend event
      await new Promise<void>((resolve, reject) => {
        utterance.onend = () => {
          setLoading(false);
          resolve();
        };
        utterance.onerror = (event) => {
          setLoading(false);
          reject(new Error(`Failed to convert text to speech: ${event.error}`));
        };
        synth.current!.speak(utterance);
      });

      toast({
        title: 'Text-to-Speech',
        description: 'Caption converted to speech.',
      });
      setAudioUrl('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert text to speech.',
        variant: 'destructive',
      });
      setAudioUrl(null);
      synth.current.cancel();
    } finally {
      setLoading(false);
    }
  }, [caption, toast, speechSynthesisSupported]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !hasCameraPermission) {
      toast({
        title: 'Error',
        description: 'Camera not accessible. Please check permissions.',
        variant: 'destructive',
      });
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/png');
      setImage(dataUrl);
    } else {
      toast({
        title: 'Error',
        description: 'Could not capture image frame.',
        variant: 'destructive',
      });
    }
  }, [hasCameraPermission, toast]);

  const handleStartScreenNext = () => {
    setShowStartScreen(false);
    setShowNameInputScreen(true);
  };

  const handleNameInputNext = (name: string) => {
    setUserName(name);
    setShowNameInputScreen(false);
  };

  return showStartScreen ? (
      <StartScreen onNext={handleStartScreenNext} />
  ) : showNameInputScreen ? (
      <NameInputScreen onNext={handleNameInputNext} />
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md space-y-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="mr-2 h-5 w-5 text-primary" />
            Hello {userName}!!
          </CardTitle>
          <CardDescription>Upload an image and let AI generate a caption for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md border-muted">
            <label htmlFor="image-upload" className="cursor-pointer">
              {image ? (
                <img src={image} alt="Uploaded" className="max-w-full max-h-48 rounded-md object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload an image</p>
                </div>
              )}
            </label>
            <Input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageUpload} />

            {hasCameraPermission && (
                <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
            )}

            { hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access to use this feature.
                  </AlertDescription>
                </Alert>
            )
            }
          </div>

          {hasCameraPermission && (
              <Button variant="secondary" onClick={captureImage} disabled={loading}>
                <Camera className="mr-2 h-4 w-4" />
                Take Picture
              </Button>
          )}


          <Textarea
            placeholder="Generated caption will appear here..."
            value={caption}
            readOnly
            className="resize-none bg-white text-gray-500"
          />

          <div className="flex justify-between space-x-2">
            <Button onClick={generateCaption} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Caption'}
            </Button>
            <Button variant="secondary" onClick={handleTextToSpeech} disabled={loading || !caption || !speechSynthesisSupported}>
              <Volume2 className="mr-2 h-4 w-4" />
              Speak
            </Button>
          </div>

          {audioUrl ? (
            <audio controls src={audioUrl} className="w-full">
              Your browser does not support the audio element.
            </audio>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
