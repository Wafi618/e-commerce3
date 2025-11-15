import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Star Accessories
            </Link>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600">
            যোগাযোগ করুন
          </p>
        </div>

        {/* Office Locations */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Dhaka Office */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Dhaka Office
            </h2>
            <p className="text-lg text-gray-600 mb-6">ঢাকা অফিস</p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900">Rupayan Tower, Nowfa Plaza</p>
                  <p className="text-gray-900">Shop No- 117, 103-Ibrahimpur</p>
                  <p className="text-gray-900">Kafrul, Dhaka Cant. Dhaka- 1206</p>
                  <p className="text-gray-600 text-sm mt-2">
                    রূপায়ণ টাওয়ার, নওফা প্লাজা<br />
                    দোকান নং- ১১৭, ১০৩-ইব্রাহিমপুর<br />
                    কাফরুল, ঢাকা ক্যান্টনমেন্ট, ঢাকা- ১২০৬
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <a
                  href="tel:+8801752983864"
                  className="text-gray-900 hover:text-blue-600"
                >
                  +880 1752 983864
                </a>
              </div>
            </div>
          </div>

          {/* Chattogram Office */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Chattogram Office
            </h2>
            <p className="text-lg text-gray-600 mb-6">চট্টগ্রাম অফিস</p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-900">Sanmar Silver Spring, G-3</p>
                  <p className="text-gray-900">324/1142, Mehdibag</p>
                  <p className="text-gray-900">Chattogram</p>
                  <p className="text-gray-600 text-sm mt-2">
                    স্যানমার সিলভার স্প্রিং, জি-৩<br />
                    ৩২৪/১১৪২, মেহেদীবাগ<br />
                    চট্টগ্রাম
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <a
                  href="tel:+880181962477"
                  className="text-gray-900 hover:text-blue-600"
                >
                  +880 181 962477
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CEO Contact */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-xl p-8 text-white mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-2">
              A.K.M Robiul Hassan
            </h2>
            <p className="text-blue-100 mb-6">
              Chief Executive Officer | প্রধান নির্বাহী কর্মকর্তা
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <a href="tel:+8801752983864" className="hover:text-blue-200">
                  +880 1752 983864
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <a href="tel:+8801994670106" className="hover:text-blue-200">
                  +880 1994 670106
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                <a
                  href="mailto:infostaraccess@gmail.com"
                  className="hover:text-blue-200"
                >
                  infostaraccess@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5" />
                <a
                  href="mailto:akmrobiul2024@gmail.com"
                  className="hover:text-blue-200"
                >
                  akmrobiul2024@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Scan for Easy Contact</h2>
          <div className="flex justify-center">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <Image
                src="/qr-code.png"
                alt="Contact QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
          </div>
          <p className="text-gray-600 mt-4">স্ক্যান করে দ্রুত যোগাযোগ করুন</p>
        </div>

        {/* Map or Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Visit us during business hours or contact us for any inquiries
          </p>
          <p className="text-gray-600 mt-2">
            ব্যবসার সময়ে আমাদের দেখতে আসুন বা যেকোনো জিজ্ঞাসার জন্য যোগাযোগ করুন
          </p>
        </div>
      </div>
    </div>
  );
}
