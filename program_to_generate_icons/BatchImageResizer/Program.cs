using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace BatchImageResizer
{
    class Program
    {

        const string FORMATSXMLFILELOCATION = @"formats.xml";

        static void Main(string[] args)
        {
            string sourceFile = null;
            if (args.Length > 0)
            {
                sourceFile = args[0];
            }
            else
            {
                Console.WriteLine(@"Path to source image ('C:\Users\Administrator\Documents\Images\MyIcon.png'):");
                sourceFile = Console.ReadLine();
            }

            string targetDirectory = null;
            if (args.Length > 1)
            {
                targetDirectory = args[1];
            }
            else
            {
                Console.WriteLine(@"Path to target directory ('C:\Users\Administrator\Documents\Visual Studio 2013\Projects\MyProject\MyProject\res\icons'):");
                targetDirectory = Console.ReadLine();
            }
            
            Image image = Image.FromFile(sourceFile);
            XDocument doc = XDocument.Load(FORMATSXMLFILELOCATION);
            var formats = doc.Descendants("format");
            foreach (XElement format in formats)
            {
                ResizeImage(image, Convert.ToInt32(format.Attribute("width").Value), Convert.ToInt32(format.Attribute("height").Value), string.Format(@"{0}\{1}", targetDirectory, format.Attribute("name").Value));
            }
        }

        private static void ResizeImage(Image image, int width, int height, string targetFileLocation)
        {
            DirectoryInfo dir = Directory.CreateDirectory(Path.GetDirectoryName(targetFileLocation));
            Bitmap result = ResizeImage(image, width, height);
            result.Save(targetFileLocation);
        }

        /// <summary>
        /// Resize the image to the specified width and height.
        /// </summary>
        /// <param name="image">The image to resize.</param>
        /// <param name="width">The width to resize to.</param>
        /// <param name="height">The height to resize to.</param>
        /// <returns>The resized image.</returns>
        private static Bitmap ResizeImage(Image image, int width, int height)
        {
            var destRect = new Rectangle(0, 0, width, height);
            var destImage = new Bitmap(width, height);

            destImage.SetResolution(image.HorizontalResolution, image.VerticalResolution);

            using (var graphics = Graphics.FromImage(destImage))
            {
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.CompositingQuality = CompositingQuality.HighQuality;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.SmoothingMode = SmoothingMode.HighQuality;
                graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;

                using (var wrapMode = new ImageAttributes())
                {
                    wrapMode.SetWrapMode(WrapMode.TileFlipXY);
                    graphics.DrawImage(image, destRect, 0, 0, image.Width, image.Height, GraphicsUnit.Pixel, wrapMode);
                }
            }

            return destImage;
        }

    }
}
